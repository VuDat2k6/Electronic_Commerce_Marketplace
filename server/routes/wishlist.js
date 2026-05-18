/**
 * Wishlist Routes with Authentication
 * 
 * Provides secure wishlist endpoints:
 * - GET /api/wishlist - Authenticated (own wishlist)
 * - POST /api/wishlist - Authenticated (add item)
 * - GET /api/wishlist/:userId - Authenticated (own wishlist)
 * - DELETE /api/wishlist/:userId/:productId - Authenticated (remove item)
 * 
 * @module routes/wishlist
 */

const express = require("express");
const router = express.Router();

const {
  getAllWishlistByUserId,
  getAllWishlist,
  createWishItem,
  deleteWishItem,
  getSingleProductFromWishlist
} = require("../controllers/wishlist");

const { authenticate, protectBuyer } = require("../middleware/auth");

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * GET /api/wishlist
 * Get all wishlists (admin view)
 * Admin only
 */
router.get("/", authenticate, getAllWishlist);

/**
 * POST /api/wishlist
 * Add item to wishlist
 * Authenticated user
 */
router.post("/", authenticate, createWishItem);

/**
 * GET /api/wishlist/:userId
 * Get wishlist for a specific user
 * Authenticated user (own wishlist) or Admin
 */
router.get("/:userId", authenticate, getAllWishlistByUserId);

/**
 * GET /api/wishlist/:userId/:productId
 * Get a specific item from wishlist
 * Authenticated user (own wishlist) or Admin
 */
router.get("/:userId/:productId", authenticate, getSingleProductFromWishlist);

/**
 * DELETE /api/wishlist/:userId/:productId
 * Remove item from wishlist
 * Authenticated user (own wishlist) or Admin
 */
router.delete("/:userId/:productId", authenticate, deleteWishItem);

module.exports = router;
