/**
 * Notification Controller
 * 
 * Handles user notification management:
 * - Fetching notifications with filtering and pagination
 * - Creating new notifications
 * - Marking notifications as read/unread
 * - Deleting notifications (single and bulk)
 * - Getting unread count
 * 
 * Notifications keep users informed about order updates,
 * payment status, promotions, and system alerts.
 * 
 * @module controllers/notificationController
 */

const prisma = require('../utils/db');

/**
 * GET /api/notifications/user/:userId
 * 
 * Retrieves notifications for a specific user
 * Supports filtering, search, pagination, and sorting
 * 
 * Query Parameters:
 * - type: Filter by notification type
 * - isRead: Filter by read status (true/false)
 * - search: Search in title and message
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Sort field - createdAt or priority (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 * 
 * @param {Request} request - Express request with user ID and query params
 * @param {Response} response - Express response with notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      type,
      isRead,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const allowedSortBy = ['createdAt', 'priority'];
    const allowedSortOrder = ['asc', 'desc'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = allowedSortOrder.includes(sortOrder) ? sortOrder : 'desc';

    // Build filter conditions based on query parameters
    const where = {
      userId,
      ...(type && { type }), // Add type filter if provided
      ...(isRead !== undefined && { isRead: isRead === 'true' }), // Parse string to boolean
      ...(search && {
        OR: [
          { title: { contains: search } },
          { message: { contains: search } }
        ]
      })
    };

    // Calculate pagination offset
    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;

    // Build sort object
    const orderBy = {};
    if (safeSortBy === 'priority') {
      // For priority, sort by priority first then by date
      orderBy.priority = safeSortOrder;
      orderBy.createdAt = 'desc';
    } else {
      orderBy[safeSortBy] = safeSortOrder;
    }

    // Fetch notifications, total count, and unread count in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      notifications,
      total,
      page: parsedPage,
      totalPages,
      unreadCount
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * POST /api/notifications
 * 
 * Creates a new notification for a user
 * Validates notification type and priority
 * 
 * Request Body:
 * - userId: Target user ID (required)
 * - title: Notification title (required)
 * - message: Notification message (required)
 * - type: Notification type (required) - ORDER_UPDATE, PAYMENT_STATUS, PROMOTION, SYSTEM_ALERT
 * - priority: Priority level (optional, default: NORMAL) - LOW, NORMAL, HIGH, URGENT
 * - metadata: Additional JSON data (optional)
 * 
 * @param {Request} request - Express request with notification data
 * @param {Response} response - Express response with created notification
 */
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority = 'NORMAL', metadata } = req.body;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, title, message, type' 
      });
    }

    // Validate enum values against allowed values
    const validTypes = ['ORDER_UPDATE', 'PAYMENT_STATUS', 'PROMOTION', 'SYSTEM_ALERT'];
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid notification priority' });
    }

    // Verify user exists before creating notification
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        metadata
      }
    });

    res.status(201).json(notification);
    
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

/**
 * PATCH /api/notifications/:id
 * 
 * Updates a notification (mark as read or unread)
 * Only updates the isRead field
 * 
 * @param {Request} request - Express request with notification ID and isRead value
 * @param {Response} response - Express response with updated notification
 */
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead, userId } = req.body;

    // Validate isRead is boolean
    if (typeof isRead !== 'boolean') {
      return res.status(400).json({ error: 'isRead must be a boolean value' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Security: verify notification belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    });

    res.json(notification);
    
  } catch (error) {
    // Handle notification not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notification not found' });
    }
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

/**
 * POST /api/notifications/bulk/mark-read
 * 
 * Marks multiple notifications as read in one operation
 * Only updates notifications belonging to the specified user
 * (Security: users can only mark their own notifications)
 * 
 * Request Body:
 * - notificationIds: Array of notification IDs (required)
 * - userId: User ID for authorization check (required)
 * 
 * @param {Request} request - Express request with notification IDs
 * @param {Response} response - Express response with update count
 */
const bulkMarkAsRead = async (req, res) => {
  try {
    const { notificationIds, userId } = req.body;

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'notificationIds must be a non-empty array' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update notifications with security check
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId // Security: only update user's own notifications
      },
      data: { isRead: true }
    });

    res.json({ 
      message: `${updateResult.count} notifications marked as read`,
      updatedCount: updateResult.count
    });
    
  } catch (error) {
    console.error('Error bulk marking notifications:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

/**
 * DELETE /api/notifications/:id
 * 
 * Deletes a single notification
 * Users can only delete their own notifications
 * 
 * @param {Request} request - Express request with notification ID and userId
 * @param {Response} response - Express response
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Security: verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

/**
 * DELETE /api/notifications/bulk
 * 
 * Deletes multiple notifications in one operation
 * Users can only delete their own notifications
 * 
 * Request Body:
 * - notificationIds: Array of notification IDs (required)
 * - userId: User ID for authorization check (required)
 * 
 * @param {Request} request - Express request with notification IDs
 * @param {Response} response - Express response with delete count
 */
const bulkDeleteNotifications = async (req, res) => {
  try {
    const { notificationIds, userId } = req.body;

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'notificationIds must be a non-empty array' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Delete notifications with security check
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: userId // Security: only delete user's own notifications
      }
    });

    res.json({ 
      message: `${deleteResult.count} notifications deleted`,
      deletedCount: deleteResult.count
    });
    
  } catch (error) {
    console.error('Error bulk deleting notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
};

/**
 * GET /api/notifications/user/:userId/unread-count
 * 
 * Gets the count of unread notifications for a user
 * Used for displaying notification badge
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response with count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ unreadCount });
    
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getUserNotifications,
  createNotification,
  updateNotification,
  bulkMarkAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  getUnreadCount
};