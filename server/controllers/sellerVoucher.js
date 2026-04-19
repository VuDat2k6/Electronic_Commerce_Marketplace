// server/controllers/sellerVoucher.js
const prisma = require('../utills/db');
const { asyncHandler } = require('../utills/errorHandler');

// GET /api/seller/vouchers?sellerId=xxx
const getSellerVouchers = asyncHandler(async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) throw new Error('sellerId is required');

  const vouchers = await prisma.voucher.findMany({
    where: { merchantId: sellerId },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(vouchers);
});

// POST /api/seller/vouchers
const createVoucher = asyncHandler(async (req, res) => {
  const { sellerId, code, title, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt } = req.body;

  if (!sellerId || !code || !title || !discountType || !discountValue) {
    throw new Error('sellerId, code, title, discountType, and discountValue are required');
  }

  if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
    throw new Error('discountType must be PERCENTAGE or FIXED');
  }

  if (discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
    throw new Error('Percentage discount must be between 1 and 100');
  }

  // Check for duplicate code
  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing) throw new Error('Voucher code already exists');

  const voucher = await prisma.voucher.create({
    data: {
      code: code.toUpperCase(),
      title,
      description: description || null,
      discountType,
      discountValue: parseInt(discountValue),
      minOrderValue: minOrderValue ? parseInt(minOrderValue) : null,
      maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      merchantId: sellerId,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    }
  });

  return res.status(201).json(voucher);
});

// PUT /api/seller/vouchers/:id
const updateVoucher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerId, title, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiresAt, isActive } = req.body;

  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new Error('Voucher not found');
  if (voucher.merchantId !== sellerId) throw new Error('You do not have permission to edit this voucher');

  if (discountType && !['PERCENTAGE', 'FIXED'].includes(discountType)) {
    throw new Error('discountType must be PERCENTAGE or FIXED');
  }

  if (discountType === 'PERCENTAGE' && discountValue && (discountValue < 1 || discountValue > 100)) {
    throw new Error('Percentage discount must be between 1 and 100');
  }

  const updated = await prisma.voucher.update({
    where: { id },
    data: {
      title: title ?? voucher.title,
      description: description ?? voucher.description,
      discountType: discountType ?? voucher.discountType,
      discountValue: discountValue ? parseInt(discountValue) : voucher.discountValue,
      minOrderValue: minOrderValue !== undefined ? (minOrderValue ? parseInt(minOrderValue) : null) : voucher.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseInt(maxDiscount) : null) : voucher.maxDiscount,
      usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : voucher.usageLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : voucher.expiresAt,
      isActive: isActive !== undefined ? isActive : voucher.isActive,
    }
  });

  return res.json(updated);
});

// DELETE /api/seller/vouchers/:id
const deleteVoucher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerId } = req.body;

  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new Error('Voucher not found');
  if (voucher.merchantId !== sellerId) throw new Error('You do not have permission to delete this voucher');

  await prisma.voucher.delete({ where: { id } });
  return res.status(204).send();
});

module.exports = {
  getSellerVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
