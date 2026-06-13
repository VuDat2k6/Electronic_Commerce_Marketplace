import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationStore } from '@/app/_zustand/notificationStore';
import { notificationApi } from '@/lib/notification-api';
import { NotificationFilters } from '@/types/notification';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing notifications
 */
export const useNotifications = () => {
  const { data: session } = useSession();
  const fetchSequenceRef = useRef(0);
  const {
    notifications,
    unreadCount,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    selectedIds,
    setNotifications,
    setLoading,
    setError,
    setFilters,
    markAsRead,
    deleteNotification,
    clearSelection,
    setUnreadCount
  } = useNotificationStore();

  // The NextAuth callback already places the authenticated user's ID in session.
  const getCurrentUserId = useCallback(async () => session?.user?.id || null, [session?.user?.id]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (customFilters?: NotificationFilters) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const requestId = fetchSequenceRef.current + 1;
    fetchSequenceRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const filtersToUse = customFilters || filters;
      const response = await notificationApi.getUserNotifications(userId, filtersToUse);
      if (fetchSequenceRef.current === requestId) {
        setNotifications(response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      if (fetchSequenceRef.current === requestId) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (fetchSequenceRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [filters, getCurrentUserId, setNotifications, setLoading, setError]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      const { unreadCount } = await notificationApi.getUnreadCount(userId);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [getCurrentUserId, setUnreadCount]);

  // Mark single notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.updateNotification(notificationId, true);
      markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      toast.error(errorMessage);
    }
  }, [markAsRead]);

  // Mark multiple notifications as read
  const markSelectedAsRead = useCallback(async () => {
    const userId = await getCurrentUserId();
    const idsToMarkRead = [...selectedIds]; // Create snapshot
    
    if (!userId || idsToMarkRead.length === 0) return;

    try {
      await notificationApi.bulkMarkAsRead({
        notificationIds: idsToMarkRead,
        userId
      });
      
      idsToMarkRead.forEach(id => markAsRead(id));
      clearSelection();
      
      // Refresh unread count
      await fetchUnreadCount();
      
      toast.success(`${idsToMarkRead.length} notifications marked as read`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notifications as read';
      toast.error(errorMessage);
    }
  }, [selectedIds, getCurrentUserId, markAsRead, clearSelection, fetchUnreadCount]);

  // Delete single notification
  const deleteNotificationById = useCallback(async (notificationId: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      await notificationApi.deleteNotification(notificationId, userId);
      deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      toast.error(errorMessage);
    }
  }, [getCurrentUserId, deleteNotification]);

  // Delete selected notifications
  const deleteSelectedNotifications = useCallback(async () => {
    const userId = await getCurrentUserId();
    const idsToDelete = [...selectedIds]; // Create snapshot
    
    if (!userId || idsToDelete.length === 0) {
      return;
    }

    try {
      await notificationApi.bulkDeleteNotifications({
        notificationIds: idsToDelete,
        userId
      });
      
      // Update local state - remove deleted notifications
      idsToDelete.forEach(id => deleteNotification(id));
      clearSelection();
      
      // Refresh data to ensure consistency
      await fetchNotifications();
      
      toast.success(`${idsToDelete.length} notifications deleted`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notifications';
      toast.error(errorMessage);
    }
  }, [selectedIds, getCurrentUserId, deleteNotification, clearSelection, fetchNotifications]);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchNotifications(updatedFilters);
  }, [filters, setFilters, fetchNotifications]);

  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    if (page < totalPages) {
      updateFilters({ page: page + 1 });
    }
  }, [page, totalPages, updateFilters]);

  return {
    // Data
    notifications,
    unreadCount,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    selectedIds,
    hasMore: page < totalPages,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markSelectedAsRead,
    deleteNotificationById,
    deleteSelectedNotifications,
    updateFilters,
    loadMore,
    
    // Store actions (direct access)
    setFilters,
    clearSelection
  };
};

/**
 * Hook for real-time unread count (for header badge)
 * Optimized to fetch user and count in parallel to avoid API waterfall
 */
export const useUnreadCount = () => {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const { data: session } = useSession();

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { unreadCount: nextUnreadCount } = await notificationApi.getUnreadCount(session.user.id);
      setUnreadCount(nextUnreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [session?.user?.id, setUnreadCount]);

  // Auto-refresh unread count every 30 seconds (optimized)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Listen for order completed events to refresh immediately
    const handleOrderCompleted = () => {
      setTimeout(fetchUnreadCount, 1000);
    };
    
    window.addEventListener('orderCompleted', handleOrderCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderCompleted', handleOrderCompleted);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount
  };
};
