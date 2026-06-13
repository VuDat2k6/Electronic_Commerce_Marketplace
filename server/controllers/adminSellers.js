// server/controllers/adminSellers.js
const prisma = require('../utils/db');
const { asyncHandler, AppError } = require('../utils/errorHandler');

function sellerMerchantData(seller, status) {
  return {
    name: seller.shopName || seller.email || 'Seller shop',
    description: seller.shopDescription || null,
    email: seller.email || null,
    phone: seller.shopPhone || null,
    address: seller.shopAddress || null,
    status,
  };
}

async function syncLegacyMerchant(tx, seller, status) {
  const data = sellerMerchantData(seller, status);

  await tx.merchant.upsert({
    where: { id: seller.id },
    update: data,
    create: {
      id: seller.id,
      ...data,
    },
  });
}

// GET /api/admin/sellers
const getAllSellers = asyncHandler(async (req, res) => {
  const sellers = await prisma.user.findMany({
    where: { role: 'seller' },
    select: {
      id: true, email: true, role: true,
      shopName: true, shopDescription: true, shopPhone: true,
      shopAddress: true, shopStatus: true, shopApprovedAt: true, shopCreatedAt: true,
      _count: { select: { products: true } }
    },
    orderBy: { shopCreatedAt: 'desc' }
  });
  return res.json(sellers);
});

// GET /api/admin/sellers/:id
const getSellerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, role: true,
      shopName: true, shopDescription: true, shopPhone: true,
      shopAddress: true, shopStatus: true, shopApprovedAt: true, shopCreatedAt: true,
      products: { select: { id: true, title: true, price: true, inStock: true, slug: true } },
      _count: { select: { products: true } }
    }
  });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller not found', 404);
  return res.json(seller);
});

// PATCH /api/admin/sellers/:id/approve
const approveSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const seller = await prisma.user.findUnique({ where: { id } });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller not found', 404);

  const updated = await prisma.$transaction(async (tx) => {
    const approvedSeller = await tx.user.update({
      where: { id },
      data: { shopStatus: 'ACTIVE', shopApprovedAt: new Date() },
      select: { id: true, email: true, shopName: true, shopStatus: true, shopApprovedAt: true }
    });

    await syncLegacyMerchant(tx, { ...seller, ...approvedSeller }, 'ACTIVE');

    // Notify seller
    await tx.notification.create({
      data: {
        userId: id,
        title: 'Shop approved!',
        message: `Your shop "${approvedSeller.shopName}" has been approved by the admin. You can now start listing products.`,
        type: 'SYSTEM_ALERT',
        priority: 'HIGH',
      }
    });

    return approvedSeller;
  });

  return res.json({ message: 'Seller approved successfully', seller: updated });
});

// PATCH /api/admin/sellers/:id/suspend
const suspendSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const seller = await prisma.user.findUnique({ where: { id } });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller not found', 404);

  const updated = await prisma.$transaction(async (tx) => {
    const suspendedSeller = await tx.user.update({
      where: { id },
      data: { shopStatus: 'SUSPENDED' },
      select: { id: true, email: true, shopName: true, shopStatus: true }
    });

    await syncLegacyMerchant(tx, { ...seller, ...suspendedSeller }, 'SUSPENDED');

    await tx.notification.create({
      data: {
        userId: id,
        title: 'Shop suspended',
        message: reason || 'Your shop has been suspended by the admin. Please contact support for more information.',
        type: 'SYSTEM_ALERT',
        priority: 'URGENT',
      }
    });

    return suspendedSeller;
  });

  return res.json({ message: 'Seller suspended successfully', seller: updated });
});

// DELETE /api/admin/sellers/:id
const deleteSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const seller = await prisma.user.findUnique({
    where: { id },
    include: { products: true }
  });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller not found', 404);
  if (seller.products.length > 0) {
    throw new AppError('Cannot delete seller because there are still products linked to this shop. Please remove or transfer the products first.', 400);
  }

  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
});

module.exports = { getAllSellers, getSellerById, approveSeller, suspendSeller, deleteSeller };
