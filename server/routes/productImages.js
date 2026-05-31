/**
 * Product Images Routes with Authentication
 * 
 * Provides secure product image endpoints:
 * - GET /api/images/:id - Public (get product images)
 * - POST /api/images - Seller (upload image)
 * - PUT /api/images/:id - Seller (update image)
 * - DELETE /api/images/:id - Seller (delete image)
 * 
 * @module routes/productImages
 */

const express = require('express');
const router = express.Router();

const {
  getSingleProductImages,
  createImage,
  updateImage,
  deleteImage
} = require('../controllers/productImages');

const { authenticate, requireSeller, requireActiveSeller } = require('../middleware/auth');

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/images/:id
 * Get images for a product
 * Public - no authentication required
 */
router.get('/:id', getSingleProductImages); 

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * POST /api/images
 * Upload a product image
 * Seller only
 */
router.post('/', authenticate, requireSeller, requireActiveSeller, createImage);

/**
 * PUT /api/images/:id
 * Update a product image
 * Seller only
 */
router.put('/:id', authenticate, requireSeller, requireActiveSeller, updateImage);

/**
 * DELETE /api/images/:id
 * Delete a product image
 * Seller only
 */
router.delete('/:id', authenticate, requireSeller, requireActiveSeller, deleteImage);

module.exports = router;
