/**
 * Product Images Routes with Authentication
 * 
 * Provides secure product image endpoints:
 * - GET /api/images/:id - Public (get product images)
 * - POST /api/images - Seller/Admin (upload image)
 * - PUT /api/images/:id - Seller/Admin (update image)
 * - DELETE /api/images/:id - Seller/Admin (delete image)
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

const { authenticate, requireSellerOrAdmin } = require('../middleware/auth');

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
 * Seller or Admin only
 */
router.post('/', authenticate, requireSellerOrAdmin, createImage);

/**
 * PUT /api/images/:id
 * Update a product image
 * Seller or Admin only
 */
router.put('/:id', authenticate, requireSellerOrAdmin, updateImage);

/**
 * DELETE /api/images/:id
 * Delete a product image
 * Seller or Admin only
 */
router.delete('/:id', authenticate, requireSellerOrAdmin, deleteImage);

module.exports = router;
