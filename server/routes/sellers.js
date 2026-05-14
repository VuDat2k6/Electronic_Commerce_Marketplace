// server/routes/sellers.js
// Public API - lấy thông tin seller và sản phẩm của seller
const express = require('express');
const router = express.Router();
const prisma = require('../utills/db');

// GET /api/sellers/:id - Lấy thông tin public của seller
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First verify user exists and has seller role
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'seller') {
      return res.status(404).json({ error: 'Seller không tồn tại' });
    }

    // Get merchant data for seller
    const merchant = await prisma.merchant.findFirst({
      where: { id: id },
      include: {
        products: {
          where: { status: 'PUBLISHED' },
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
        }
      }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Seller không tồn tại' });
    }

    return res.json({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      description: merchant.description,
      phone: merchant.phone,
      address: merchant.address,
      status: merchant.status,
      avatar: merchant.avatar,
      banner: merchant.banner,
      totalProducts: merchant.products.length,
      products: merchant.products
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/sellers/:id/products - Lấy sản phẩm của seller
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify user exists and has seller role
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'seller') {
      return res.status(404).json({ error: 'Seller không tồn tại' });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { merchantId: id, inStock: { gt: 0 }, status: 'PUBLISHED' },
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
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { merchantId: id, inStock: { gt: 0 }, status: 'PUBLISHED' } })
    ]);

    return res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
