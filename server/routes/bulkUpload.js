/**
 * Bulk Upload Routes with Authentication
 * 
 * Provides secure bulk upload endpoints:
 * - GET /api/bulk-upload - Seller (list batches)
 * - POST /api/bulk-upload - Seller (upload CSV)
 * - GET /api/bulk-upload/:batchId - Seller (batch detail)
 * - PUT /api/bulk-upload/:batchId - Seller (update items)
 * - DELETE /api/bulk-upload/:batchId - Seller (delete batch)
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

const { authenticate, requireSeller, requireActiveSeller } = require('../middleware/auth');

// ============================================================
// PROTECTED ROUTES
// All bulk upload routes require authentication
// ============================================================

/**
 * GET /api/bulk-upload
 * List all bulk upload batches
 * Active seller only
 */
router.get("/", authenticate, requireSeller, requireActiveSeller, listBatches);

/**
 * POST /api/bulk-upload
 * Upload CSV and create batch
 * Active seller only
 */
router.post("/", authenticate, requireSeller, requireActiveSeller, uploadCsvAndCreateBatch);

/**
 * GET /api/bulk-upload/:batchId
 * Get batch detail
 * Active seller only
 */
router.get("/:batchId", authenticate, requireSeller, requireActiveSeller, getBatchDetail);

/**
 * PUT /api/bulk-upload/:batchId
 * Update batch items
 * Active seller only
 */
router.put("/:batchId", authenticate, requireSeller, requireActiveSeller, updateBatchItems);

/**
 * DELETE /api/bulk-upload/:batchId
 * Delete a batch
 * Active seller only
 */
router.delete("/:batchId", authenticate, requireSeller, requireActiveSeller, deleteBatch);

module.exports = router;
