/**
 * Customer Orders Routes with Authentication
 * 
 * Provides secure order endpoints:
 * - GET /api/orders - Admin only (list all orders)
 * - POST /api/orders - Authenticated (create order)
 * - GET /api/orders/:id - Authenticated (own orders) / Admin
 * - PUT /api/orders/:id - Admin only (update order)
 * - DELETE /api/orders/:id - Admin only (delete order)
 * 
 * @module routes/customer_orders
 */

const express = require('express');
const router = express.Router();

const {
  getCustomerOrder,
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getAllOrders 
} = require('../controllers/customer_orders');

const { authenticate, requireAdmin, authenticateOptional } = require('../middleware/auth');

// ============================================================
// PUBLIC/PROTECTED ROUTES
// ============================================================

/**
 * POST /api/orders
 * Create a new order
 * Authenticated users can create orders
 * Order total is calculated server-side
 */
router.post('/', authenticate, (req, res) => {
  res.status(410).json({
    error: 'Legacy order creation is disabled. Use the canonical checkout endpoint.',
  });
});

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * GET /api/orders
 * List all orders with pagination
 * Admin only
 */
router.get('/', authenticate, requireAdmin, getAllOrders);

/**
 * PUT /api/orders/:id
 * Update an order
 * Admin only
 */
router.put('/:id', authenticate, requireAdmin, updateCustomerOrder);

/**
 * DELETE /api/orders/:id
 * Delete an order
 * Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteCustomerOrder);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * GET /api/orders/:id
 * Get a single order by ID
 * Authenticated user (own orders) or Admin
 */
router.get('/:id', authenticate, requireAdmin, getCustomerOrder);

module.exports = router;
