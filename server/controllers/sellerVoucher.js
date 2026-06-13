// server/controllers/sellerVoucher.js
const prisma = require('../utils/db');
const { AppError, asyncHandler } = require('../utils/errorHandler');

const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED'];

function getSellerId(req) {
  return req.user.role === 'admin' && (req.query.sellerId || req.body.sellerId)
    ? (req.query.sellerId || req.body.sellerId)
    : req.user.id;
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeDiscountType(discountType) {
  return String(discountType || '').trim().toUpperCase();
}

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
  return parsed;
}

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return parsePositiveInt(value, fieldName);
}

function parseExpiryDate(value) {
  if (!value) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('expiresAt must be a valid date', 400);
  }
  return parsed;
}

async function ensureSellerMerchant(sellerId) {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      email: true,
      role: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
    },
  });

  if (!seller) {
    throw new AppError('Seller not found', 404);
  }

  if (seller.role !== 'seller') {
    throw new AppError('User is not a seller', 400);
  }

  if (seller.shopStatus !== 'ACTIVE') {
    throw new AppError('Seller shop must be active before creating vouchers', 403);
  }

  const merchantData = {
    name: seller.shopName || seller.email || 'Seller shop',
    description: seller.shopDescription || null,
    email: seller.email || null,
    phone: seller.shopPhone || null,
    address: seller.shopAddress || null,
    status: seller.shopStatus,
  };

  return prisma.merchant.upsert({
    where: { id: seller.id },
    update: merchantData,
    create: {
      id: seller.id,
      ...merchantData,
    },
  });
}

function validateDiscount(discountType, discountValue) {
  if (!DISCOUNT_TYPES.includes(discountType)) {
    throw new AppError('discountType must be PERCENTAGE or FIXED', 400);
  }

  const parsedDiscountValue = parsePositiveInt(discountValue, 'discountValue');

  if (discountType === 'PERCENTAGE' && (parsedDiscountValue < 1 || parsedDiscountValue > 100)) {
    throw new AppError('Percentage discount must be between 1 and 100', 400);
  }

  return parsedDiscountValue;
}

// GET /api/seller/vouchers
const getSellerVouchers = asyncHandler(async (req, res) => {
  const sellerId = getSellerId(req);

  const vouchers = await prisma.voucher.findMany({
    where: { merchantId: sellerId },
    orderBy: { startsAt: 'desc' }
  });

  return res.json(vouchers);
});

// POST /api/seller/vouchers
const createVoucher = asyncHandler(async (req, res) => {
  const sellerId = getSellerId(req);
  const { code, title, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt } = req.body;
  const normalizedCode = normalizeCode(code);
  const normalizedTitle = String(title || '').trim();
  const normalizedDiscountType = normalizeDiscountType(discountType);

  if (!sellerId || !normalizedCode || !normalizedTitle || !normalizedDiscountType || discountValue === undefined || discountValue === null || discountValue === '') {
    throw new AppError('sellerId, code, title, discountType, and discountValue are required', 400);
  }

  const parsedDiscountValue = validateDiscount(normalizedDiscountType, discountValue);
  const parsedExpiresAt = parseExpiryDate(expiresAt);
  const parsedMinOrderValue = parseOptionalPositiveInt(minOrderValue, 'minOrderValue');
  const parsedMaxDiscount = parseOptionalPositiveInt(maxDiscount, 'maxDiscount');
  const parsedUsageLimit = parseOptionalPositiveInt(usageLimit, 'usageLimit');

  await ensureSellerMerchant(sellerId);

  // Check for duplicate code
  const existing = await prisma.voucher.findUnique({ where: { code: normalizedCode } });
  if (existing) throw new AppError('Voucher code already exists', 409);

  const voucher = await prisma.voucher.create({
    data: {
      code: normalizedCode,
      title: normalizedTitle,
      description: description ? String(description).trim() : null,
      discountType: normalizedDiscountType,
      discountValue: parsedDiscountValue,
      minOrderValue: parsedMinOrderValue,
      maxDiscount: parsedMaxDiscount,
      usageLimit: parsedUsageLimit,
      merchantId: sellerId,
      expiresAt: parsedExpiresAt,
      isActive: true,
    }
  });

  return res.status(201).json(voucher);
});

// PUT /api/seller/vouchers/:id
const updateVoucher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = getSellerId(req);
  const { title, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt, isActive } = req.body;

  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new AppError('Voucher not found', 404);
  if (voucher.merchantId !== sellerId) throw new AppError('You do not have permission to edit this voucher', 403);

  const normalizedDiscountType = discountType ? normalizeDiscountType(discountType) : voucher.discountType;
  let parsedDiscountValue = voucher.discountValue;

  if (discountValue !== undefined && discountValue !== null && discountValue !== '') {
    parsedDiscountValue = validateDiscount(normalizedDiscountType, discountValue);
  } else if (!DISCOUNT_TYPES.includes(normalizedDiscountType)) {
    throw new AppError('discountType must be PERCENTAGE or FIXED', 400);
  }

  if (normalizedDiscountType === 'PERCENTAGE' && (parsedDiscountValue < 1 || parsedDiscountValue > 100)) {
    throw new AppError('Percentage discount must be between 1 and 100', 400);
  }

  if (title !== undefined && !String(title).trim()) {
    throw new AppError('title cannot be empty', 400);
  }

  const updated = await prisma.voucher.update({
    where: { id },
    data: {
      title: title !== undefined ? String(title).trim() : voucher.title,
      description: description !== undefined ? (description ? String(description).trim() : null) : voucher.description,
      discountType: normalizedDiscountType,
      discountValue: parsedDiscountValue,
      minOrderValue: minOrderValue !== undefined ? parseOptionalPositiveInt(minOrderValue, 'minOrderValue') : voucher.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? parseOptionalPositiveInt(maxDiscount, 'maxDiscount') : voucher.maxDiscount,
      usageLimit: usageLimit !== undefined ? parseOptionalPositiveInt(usageLimit, 'usageLimit') : voucher.usageLimit,
      expiresAt: expiresAt ? parseExpiryDate(expiresAt) : voucher.expiresAt,
      isActive: isActive !== undefined ? isActive : voucher.isActive,
    }
  });

  return res.json(updated);
});

// DELETE /api/seller/vouchers/:id
const deleteVoucher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = getSellerId(req);

  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new AppError('Voucher not found', 404);
  if (voucher.merchantId !== sellerId) throw new AppError('You do not have permission to delete this voucher', 403);

  await prisma.voucher.delete({ where: { id } });
  return res.status(204).send();
});

module.exports = {
  getSellerVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
