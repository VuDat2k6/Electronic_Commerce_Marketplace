// server/routes/sellerAnalytics.js
const express = require('express');
const router = express.Router();
const { getSellerAnalytics } = require('../controllers/sellerAnalytics');

// GET /api/seller/analytics/overview?sellerId=xxx
router.get('/overview', getSellerAnalytics);

module.exports = router;
