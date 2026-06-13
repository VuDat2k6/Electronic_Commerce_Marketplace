/**
 * Admin Sellers Routes
 * 
 * Provides secure admin endpoints for seller management:
 * - GET /api/admin/sellers - Admin only (list all sellers)
 * - GET /api/admin/sellers/:id - Admin only (get seller details)
 * - PATCH /api/admin/sellers/:id/approve - Admin only (approve seller)
 * - PATCH /api/admin/sellers/:id/suspend - Admin only (suspend seller)
 * - DELETE /api/admin/sellers/:id - Admin only (delete seller)
 * 
 * @module routes/adminSellers
 */

const express = require('express');
const router = express.Router();

const {
  getAllSellers,
  getSellerById,
  approveSeller,
  suspendSeller,
  deleteSeller
} = require('../controllers/adminSellers');

const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// GET /api/admin/sellers - List all sellers
router.get('/', getAllSellers);

// GET /api/admin/sellers/:id - Get seller by ID
router.get('/:id', getSellerById);

// PATCH /api/admin/sellers/:id/approve - Approve seller
router.patch('/:id/approve', approveSeller);

// PATCH /api/admin/sellers/:id/suspend - Suspend seller
router.patch('/:id/suspend', suspendSeller);

// DELETE /api/admin/sellers/:id - Delete seller
router.delete('/:id', deleteSeller);

module.exports = router;
