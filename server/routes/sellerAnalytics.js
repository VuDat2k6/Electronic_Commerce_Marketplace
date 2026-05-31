// server/routes/sellerAnalytics.js
const express = require('express');
const router = express.Router();
const { getSellerAnalytics } = require('../controllers/sellerAnalytics');
const { authenticate, requireSellerOrAdmin, requireActiveSeller } = require('../middleware/auth');

// GET /api/seller/analytics/overview
router.get('/overview', authenticate, requireSellerOrAdmin, requireActiveSeller, getSellerAnalytics);

module.exports = router;
