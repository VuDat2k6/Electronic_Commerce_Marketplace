// server/routes/seller.js
const express = require('express');
const router = express.Router();
const {
  registerAsSeller,
  getSellerDashboard,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateOrderItemStatus,
  getSellerSettings,
  updateSellerSettings,
} = require('../controllers/seller');

// Đăng ký trở thành seller (user đã login gọi endpoint này)
// POST /api/seller/register
// Body: { shopName, shopDescription, shopPhone, shopAddress }
router.post('/register', registerAsSeller);

// Dashboard stats của seller
// GET /api/seller/dashboard?sellerId=xxx
router.get('/dashboard', getSellerDashboard);

// Sản phẩm của seller
router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.put('/products/:id', updateSellerProduct);
router.delete('/products/:id', deleteSellerProduct);

// Đơn hàng seller nhận được (qua Order_item.sellerId)
router.get('/orders', getSellerOrders);
router.patch('/orders/:itemId/status', updateOrderItemStatus);

// Thông tin shop
router.get('/settings', getSellerSettings);
router.put('/settings', updateSellerSettings);

module.exports = router;
