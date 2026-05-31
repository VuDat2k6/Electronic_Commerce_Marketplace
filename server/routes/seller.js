/**
 * Seller Routes with Authentication and IDOR Protection
 * 
 * Provides secure seller endpoints with proper authentication:
 * - POST /api/seller/register - Authenticated user (become seller)
 * - GET /api/seller/dashboard - Authenticated seller (own dashboard)
 * - GET /api/seller/products - Authenticated seller (own products)
 * - POST /api/seller/products - Authenticated seller (create product)
 * - PUT /api/seller/products/:id - Authenticated seller (own products)
 * - DELETE /api/seller/products/:id - Authenticated seller (own products)
 * - GET /api/seller/orders - Authenticated seller (own orders)
 * - PATCH /api/seller/orders/:itemId/status - Authenticated seller (own orders)
 * - GET /api/seller/settings - Authenticated seller (own settings)
 * - PUT /api/seller/settings - Authenticated seller (own settings)
 * 
 * Security measures:
 * - All routes require authentication
 * - sellerId is extracted from JWT token, not request body
 * - IDOR protection ensures sellers can only access their own resources
 * 
 * @module routes/seller
 */

const express = require('express');
const router = express.Router();

const {
  registerAsSeller,
  getSellerDashboard,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateOrderItemStatus,
  getSellerSettings,
  updateSellerSettings,
} = require('../controllers/seller');

const { authenticate, requireSellerOrAdmin, requireSeller, requireActiveSeller } = require('../middleware/auth');

// ============================================================
// SELLER REGISTRATION (authenticated user becomes seller)
// ============================================================

/**
 * POST /api/seller/register
 * Convert a regular user into a seller (waiting for admin approval)
 * Authenticated user only
 */
router.post('/register', authenticate, registerAsSeller);

// ============================================================
// SELLER DASHBOARD (authenticated seller only)
// ============================================================

/**
 * GET /api/seller/dashboard
 * Get seller dashboard statistics
 * Authenticated seller only - uses sellerId from JWT token
 */
router.get('/dashboard', authenticate, requireSellerOrAdmin, requireActiveSeller, getSellerDashboard);

// ============================================================
// SELLER PRODUCTS (authenticated seller only)
// ============================================================

/**
 * GET /api/seller/products
 * Get seller's own products
 * Authenticated seller only - uses sellerId from JWT token
 */
router.get('/products', authenticate, requireSeller, requireActiveSeller, getSellerProducts);

/**
 * POST /api/seller/products
 * Create a new product for the seller
 * Authenticated seller only - uses sellerId from JWT token
 */
router.post('/products', authenticate, requireSeller, requireActiveSeller, createSellerProduct);

/**
 * PUT /api/seller/products/:id
 * Update seller's own product
 * Authenticated seller only - verifies product belongs to seller
 */
router.put('/products/:id', authenticate, requireSeller, requireActiveSeller, updateSellerProduct);

/**
 * DELETE /api/seller/products/:id
 * Delete seller's own product
 * Authenticated seller only - verifies product belongs to seller
 */
router.delete('/products/:id', authenticate, requireSeller, requireActiveSeller, deleteSellerProduct);

// ============================================================
// SELLER ORDERS (authenticated seller only)
// ============================================================

/**
 * GET /api/seller/orders
 * Get seller's own orders
 * Authenticated seller only - uses sellerId from JWT token
 */
router.get('/orders', authenticate, requireSellerOrAdmin, requireActiveSeller, getSellerOrders);

/**
 * PATCH /api/seller/orders/:itemId/status
 * Update order item status
 * Authenticated seller only - verifies item belongs to seller
 */
router.patch('/orders/:itemId/status', authenticate, requireSellerOrAdmin, requireActiveSeller, updateOrderItemStatus);

// ============================================================
// SELLER SETTINGS (authenticated seller only)
// ============================================================

/**
 * GET /api/seller/settings
 * Get seller's shop settings
 * Authenticated seller only - uses sellerId from JWT token
 */
router.get('/settings', authenticate, requireSellerOrAdmin, requireActiveSeller, getSellerSettings);

/**
 * PUT /api/seller/settings
 * Update seller's shop settings
 * Authenticated seller only - uses sellerId from JWT token
 */
router.put('/settings', authenticate, requireSellerOrAdmin, requireActiveSeller, updateSellerSettings);

module.exports = router;
