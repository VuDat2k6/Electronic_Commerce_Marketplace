/**
 * Review Routes with Authentication
 * 
 * Provides secure review endpoints:
 * - GET /api/reviews/product/:productId - Public (product reviews)
 * - GET /api/reviews/merchant/:merchantId - Public (merchant reviews)
 * - GET /api/reviews/user/:userId - Authenticated (own reviews)
 * - GET /api/reviews/stats/:productId - Public (review stats)
 * - POST /api/reviews - Authenticated (create review)
 * - DELETE /api/reviews/:id - Authenticated (delete own review)
 * 
 * @module routes/review
 */

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

const { authenticate, authenticateOptional } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/reviews/product/:productId
 * Get reviews for a product
 * Public - no authentication required
 */
router.get("/product/:productId", getProductReviews);

/**
 * GET /api/reviews/merchant/:merchantId
 * Get reviews for a merchant
 * Public - no authentication required
 */
router.get("/merchant/:merchantId", getMerchantReviews);

/**
 * GET /api/reviews/stats/:productId
 * Get review statistics for a product
 * Public - no authentication required
 */
router.get("/stats/:productId", getProductReviewStats);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * GET /api/reviews/user/:userId
 * Get reviews by a user
 * Authenticated user (own reviews)
 */
router.get("/user/:userId", authenticate, getUserReviews);

/**
 * POST /api/reviews
 * Create a new review
 * Authenticated user
 */
router.post("/", authenticate, createReview);

/**
 * DELETE /api/reviews/:id
 * Delete a review (soft delete)
 * Authenticated user (own review) or Admin
 */
router.delete("/:id", authenticate, deleteReview);

module.exports = router;
