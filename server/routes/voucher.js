/**
 * Voucher Routes with Authentication
 * 
 * Provides secure voucher endpoints:
 * - GET /api/vouchers - Public (list active vouchers)
 * - POST /api/vouchers - Admin only (create voucher)
 * - POST /api/vouchers/validate - Authenticated (validate voucher)
 * - POST /api/vouchers/apply - Authenticated (apply voucher to order)
 * - PUT /api/vouchers/:id - Admin only (update voucher)
 * - DELETE /api/vouchers/:id - Admin only (delete voucher)
 * 
 * @module routes/voucher
 */

const express = require("express");
const router = express.Router();

const {
  createVoucher,
  getVouchers,
  validateVoucher,
  applyVoucher,
  updateVoucher,
  deleteVoucher,
} = require("../controllers/voucher");

const { authenticate, requireAdmin } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/vouchers
 * Get list of active vouchers
 * Public - no authentication required
 */
router.get("/", getVouchers);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * POST /api/vouchers/validate
 * Validate a voucher code
 * Authenticated user
 */
router.post("/validate", authenticate, validateVoucher);

/**
 * POST /api/vouchers/apply
 * Apply voucher to order
 * Authenticated user
 */
router.post("/apply", authenticate, applyVoucher);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * POST /api/vouchers
 * Create a new voucher
 * Admin only
 */
router.post("/", authenticate, requireAdmin, createVoucher);

/**
 * PUT /api/vouchers/:id
 * Update a voucher
 * Admin only
 */
router.put("/:id", authenticate, requireAdmin, updateVoucher);

/**
 * DELETE /api/vouchers/:id
 * Delete a voucher (soft delete)
 * Admin only
 */
router.delete("/:id", authenticate, requireAdmin, deleteVoucher);

module.exports = router;
