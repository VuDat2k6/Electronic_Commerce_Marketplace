/**
 * Notifications Routes with Authentication
 * 
 * Provides secure notification endpoints:
 * - GET /api/notifications/:userId - Authenticated (own notifications)
 * - POST /api/notifications - Authenticated (create notification)
 * - PUT /api/notifications/:id - Authenticated (update notification)
 * - DELETE /api/notifications/:id - Authenticated (delete notification)
 * 
 * @module routes/notifications
 */

const express = require('express');
const router = express.Router();

const {
  getUserNotifications,
  createNotification,
  updateNotification,
  bulkMarkAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  getUnreadCount
} = require('../controllers/notificationController');

const { authenticate } = require('../middleware/auth');

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

/**
 * GET /api/notifications/:userId/unread-count
 * Get unread notification count
 * Authenticated user (own count)
 */
router.get('/:userId/unread-count', authenticate, getUnreadCount);

/**
 * GET /api/notifications/:userId
 * Get user notifications
 * Authenticated user (own notifications)
 */
router.get('/:userId', authenticate, getUserNotifications);

/**
 * POST /api/notifications
 * Create new notification (internal use, typically from other services)
 * Authenticated
 */
router.post('/', authenticate, createNotification);

/**
 * POST /api/notifications/mark-read
 * Bulk mark notifications as read
 * Authenticated user
 */
router.post('/mark-read', authenticate, bulkMarkAsRead);

/**
 * DELETE /api/notifications/bulk
 * Bulk delete notifications
 * Authenticated user
 */
router.delete('/bulk', authenticate, bulkDeleteNotifications);

/**
 * PUT /api/notifications/:id
 * Update notification (mark as read/unread)
 * Authenticated user (own notification)
 */
router.put('/:id', authenticate, updateNotification);

/**
 * DELETE /api/notifications/:id
 * Delete single notification
 * Authenticated user (own notification)
 */
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
