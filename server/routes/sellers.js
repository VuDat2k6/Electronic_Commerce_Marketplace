/**
 * Public Sellers Routes
 * 
 * Provides public endpoints for viewing seller information:
 * - GET /api/sellers/:id - Public (seller info)
 * - GET /api/sellers/:id/products - Public (seller products)
 * 
 * @module routes/sellers
 */

const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');
const { asyncHandler, AppError } = require('../utils/errorHandler');

/**
 * GET /api/sellers/:id
 * Get public seller information and products
 * Public - no authentication required
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, shopStatus: true }
  });

  if (!user || user.role !== 'seller') {
    throw new AppError('Seller not found', 404);
  }

  if (user.shopStatus !== 'ACTIVE') {
    throw new AppError('Seller shop is not active', 404);
  }

  // Get seller data from User model (not Merchant)
  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
      shopApprovedAt: true,
      createdAt: true
    }
  });

  // Get active products
  const products = await prisma.product.findMany({
    where: { sellerId: id, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      mainImage: true,
      price: true,
      inStock: true,
      rating: true,
      category: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({
    id: seller.id,
    shopName: seller.shopName,
    description: seller.shopDescription,
    phone: seller.shopPhone,
    address: seller.shopAddress,
    status: seller.shopStatus,
    totalProducts: products.length,
    products
  });
}));

/**
 * GET /api/sellers/:id/products
 * Get paginated seller products
 * Public - no authentication required
 */
router.get('/:id/products', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, shopStatus: true }
  });

  if (!user || user.role !== 'seller') {
    throw new AppError('Seller not found', 404);
  }

  if (user.shopStatus !== 'ACTIVE') {
    throw new AppError('Seller shop is not active', 404);
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: id, status: 'PUBLISHED', inStock: { gt: 0 } },
      select: {
        id: true,
        title: true,
        slug: true,
        mainImage: true,
        price: true,
        inStock: true,
        rating: true,
        category: { select: { name: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ 
      where: { sellerId: id, status: 'PUBLISHED', inStock: { gt: 0 } } 
    })
  ]);

  return res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router;
