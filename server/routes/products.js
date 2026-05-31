/**
 * Products Routes with Authentication
 * 
 * Provides secure product endpoints:
 * - GET /api/products - Public (list products)
 * - GET /api/products?mode=admin - Admin only (moderation list)
 * - GET /api/products/moderation/:id - Admin only (moderation details)
 * - POST /api/products/moderation/:id/warnings - Admin only (notify seller)
 * - POST /api/products - Seller only (create product)
 * - GET /api/products/:id - Public (get product)
 * - PUT /api/products/:id - Seller (own products)
 * - DELETE /api/products/:id - Seller (own products)
 * 
 * @module routes/products
 */

const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getModerationProduct,
  sendProductViolationWarning,
  searchProducts,
  getProductById,
} = require("../controllers/products");

const { authenticate, requireSeller, requireActiveSeller, requireAdmin } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

/**
 * GET /api/products
 * List all products with optional filters
 * Public - no authentication required
 */
router.get("/", (req, res, next) => {
  if (req.query.mode === "admin") {
    return authenticate(req, res, (authError) => {
      if (authError) return next(authError);
      return requireAdmin(req, res, next);
    });
  }
  return next();
}, getAllProducts);

/**
 * GET /api/products/search
 * Search products
 * Public - no authentication required
 */
router.get("/search", searchProducts);

/**
 * GET /api/products/moderation/:id
 * Get compliance review data for a listing
 * Admin only
 */
router.get("/moderation/:id", authenticate, requireAdmin, getModerationProduct);

/**
 * POST /api/products/moderation/:id/warnings
 * Send a compliance warning to the owning seller
 * Admin only
 */
router.post("/moderation/:id/warnings", authenticate, requireAdmin, sendProductViolationWarning);

/**
 * GET /api/products/:id
 * Get product by ID
 * Public - no authentication required
 */
router.get("/:id", getProductById);

// ============================================================
// PROTECTED ROUTES (auth required)
// ============================================================

/**
 * POST /api/products
 * Create a new product
 * Seller only
 */
router.post("/", authenticate, requireSeller, requireActiveSeller, createProduct);

/**
 * PUT /api/products/:id
 * Update a product
 * Seller (own products)
 */
router.put("/:id", authenticate, requireSeller, requireActiveSeller, updateProduct);

/**
 * DELETE /api/products/:id
 * Delete a product
 * Seller (own products)
 */
router.delete("/:id", authenticate, requireSeller, requireActiveSeller, deleteProduct);

module.exports = router;
