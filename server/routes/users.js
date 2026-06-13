/**
 * Users Routes with Authentication
 * 
 * Provides secure user management endpoints with proper authentication:
 * - GET /api/users - Admin only (get all users)
 * - POST /api/users - Public (registration)
 * - GET /api/users/:id - Authenticated (own profile)
 * - PUT /api/users/:id - Authenticated (own profile) or Admin
 * - DELETE /api/users/:id - Admin only
 * - GET /api/users/email/:email - Authenticated (for auth flows)
 * 
 * @module routes/users
 */

const express = require('express');
const router = express.Router();

const { 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser, 
  getAllUsers, 
  getUserByEmail,
  getMe 
} = require('../controllers/users');

const { 
  authenticate, 
  requireAdmin,
  authenticateOptional 
} = require('../middleware/auth');

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

/**
 * POST /api/users
 * Register a new user account
 * Public - no authentication required
 */
router.post('/', createUser);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * GET /api/users/me
 * Get current authenticated user's profile
 * Requires authentication
 */
router.get('/me', authenticate, getMe);

/**
 * GET /api/users/email/:email
 * Get user by email address
 * Used primarily for authentication and email verification
 * Rate limited via authLimiter
 */
router.get('/email/:email', authenticate, getUserByEmail);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * GET /api/users
 * Get all users in the system
 * Admin only - returns paginated list
 */
router.get('/', authenticate, requireAdmin, getAllUsers);

// ============================================================
// USER PROFILE ROUTES (authenticated user or admin)
// ============================================================

/**
 * GET /api/users/:id
 * Get a single user by ID
 * Users can view their own profile, admins can view any profile
 */
router.get('/:id', authenticate, getUser);

/**
 * PUT /api/users/:id
 * Update user profile
 * Users can update their own profile, admins can update any profile
 * Note: Role changes are admin-only
 */
router.put('/:id', authenticate, updateUser);

/**
 * DELETE /api/users/:id
 * Delete a user account
 * Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;
