const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getMerchantReviews,
  getUserReviews,
  deleteReview,
  getProductReviewStats,
} = require("../controllers/review");

// GET /api/reviews/product/:productId - 获取商品评价
router.get("/product/:productId", getProductReviews);

// GET /api/reviews/merchant/:merchantId - 获取商户评价
router.get("/merchant/:merchantId", getMerchantReviews);

// GET /api/reviews/user/:userId - 获取用户评价
router.get("/user/:userId", getUserReviews);

// GET /api/reviews/stats/:productId - 获取商品评价统计
router.get("/stats/:productId", getProductReviewStats);

// POST /api/reviews - 创建评价
router.post("/", createReview);

// DELETE /api/reviews/:id - 删除评价（软删除）
router.delete("/:id", deleteReview);

module.exports = router;
