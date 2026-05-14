// server/routes/sellers.js
// Public API - lấy thông tin seller và sản phẩm của seller
const express = require('express');
const router = express.Router();
const prisma = require('../utills/db');

// GET /api/sellers/:id - Lấy thông tin public của seller
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const seller = await prisma.user.findUnique({
      where: { id, role: 'seller' },
      select: {
        id: true,
        email: true,
        shopName: true,
        shopDescription: true,
        shopPhone: true,
        shopAddress: true,
        shopStatus: true,
        shopApprovedAt: true,
        products: {
          where: { inStock: { gt: 0 } },
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

    if (!seller) {
      return res.status(404).json({ error: 'Seller không tồn tại' });
    }

    return res.json(seller);
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

    const seller = await prisma.user.findUnique({
      where: { id, role: 'seller' },
      select: { id: true, shopName: true, shopStatus: true }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller không tồn tại' });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: id, inStock: { gt: 0 } },
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
      prisma.product.count({ where: { sellerId: id, inStock: { gt: 0 } } })
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
