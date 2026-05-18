/**
 * Bulk Upload Routes with Authentication
 * 
 * Provides secure bulk upload endpoints:
 * - GET /api/bulk-upload - Seller/Admin (list batches)
 * - POST /api/bulk-upload - Seller/Admin (upload CSV)
 * - GET /api/bulk-upload/:batchId - Seller/Admin (batch detail)
 * - PUT /api/bulk-upload/:batchId - Seller/Admin (update items)
 * - DELETE /api/bulk-upload/:batchId - Seller/Admin (delete batch)
 * 
 * @module routes/bulkUpload
 */

const express = require("express");
const router = express.Router();

const {
  uploadCsvAndCreateBatch,
  listBatches,
  getBatchDetail,
  updateBatchItems,
  deleteBatch,
} = require("../controllers/bulkUpload");

const { authenticate, requireSellerOrAdmin } = require('../middleware/auth');

// ============================================================
// PROTECTED ROUTES
// All bulk upload routes require authentication
// ============================================================

/**
 * GET /api/bulk-upload
 * List all bulk upload batches
 * Seller or Admin only
 */
router.get("/", authenticate, requireSellerOrAdmin, listBatches);

/**
 * POST /api/bulk-upload
 * Upload CSV and create batch
 * Seller or Admin only
 */
router.post("/", authenticate, requireSellerOrAdmin, uploadCsvAndCreateBatch);

/**
 * GET /api/bulk-upload/:batchId
 * Get batch detail
 * Seller or Admin only
 */
router.get("/:batchId", authenticate, requireSellerOrAdmin, getBatchDetail);

/**
 * PUT /api/bulk-upload/:batchId
 * Update batch items
 * Seller or Admin only
 */
router.put("/:batchId", authenticate, requireSellerOrAdmin, updateBatchItems);

/**
 * DELETE /api/bulk-upload/:batchId
 * Delete a batch
 * Seller or Admin only
 */
router.delete("/:batchId", authenticate, requireSellerOrAdmin, deleteBatch);

module.exports = router;
