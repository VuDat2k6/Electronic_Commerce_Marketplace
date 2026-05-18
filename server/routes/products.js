/**
 * Products Routes with Authentication
 * 
 * Provides secure product endpoints:
 * - GET /api/products - Public (list products)
 * - POST /api/products - Seller/Admin only (create product)
 * - GET /api/products/:id - Public (get product)
 * - PUT /api/products/:id - Seller (own products) / Admin
 * - DELETE /api/products/:id - Seller (own products) / Admin
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
  searchProducts,
  getProductById,
} = require("../controllers/products");

const { authenticate, requireSellerOrAdmin } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

/**
 * GET /api/products
 * List all products with optional filters
 * Public - no authentication required
 */
router.get("/", getAllProducts);

/**
 * GET /api/products/search
 * Search products
 * Public - no authentication required
 */
router.get("/search", searchProducts);

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
 * Seller or Admin only
 */
router.post("/", authenticate, requireSellerOrAdmin, createProduct);

/**
 * PUT /api/products/:id
 * Update a product
 * Seller (own products) or Admin
 */
router.put("/:id", authenticate, requireSellerOrAdmin, updateProduct);

/**
 * DELETE /api/products/:id
 * Delete a product
 * Seller (own products) or Admin
 */
router.delete("/:id", authenticate, requireSellerOrAdmin, deleteProduct);

module.exports = router;
