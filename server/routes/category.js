/**
 * Category Routes
 * 
 * Provides secure category endpoints:
 * - GET /api/categories - Public (list categories)
 * - POST /api/categories - Admin only (create category)
 * - GET /api/categories/:id - Public (get category)
 * - PUT /api/categories/:id - Admin only (update category)
 * - DELETE /api/categories/:id - Admin only (delete category)
 * 
 * @module routes/category
 */

const express = require("express");
const router = express.Router();

const {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} = require("../controllers/category");

const { authenticate, requireAdmin } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/categories
 * List all categories
 * Public - no authentication required
 */
router.get("/", getAllCategories);

/**
 * GET /api/categories/:id
 * Get category by ID
 * Public - no authentication required
 */
router.get("/:id", getCategory);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * POST /api/categories
 * Create a new category
 * Admin only
 */
router.post("/", authenticate, requireAdmin, createCategory);

/**
 * PUT /api/categories/:id
 * Update a category
 * Admin only
 */
router.put("/:id", authenticate, requireAdmin, updateCategory);

/**
 * DELETE /api/categories/:id
 * Delete a category
 * Admin only
 */
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

module.exports = router;
