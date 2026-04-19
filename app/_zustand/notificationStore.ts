/**
 * Notification Store (Zustand)
 * 
 * Manages user notification state with the following features:
 * - Store notifications with pagination
 * - Track unread count
 * - Support filtering by type, read status
 * - Bulk selection and actions
 * - Real-time state updates
 * 
 * @module _zustand/notificationStore
 * @requires zustand
 */

import { create } from 'zustand';
import { Notification, NotificationFilters, NotificationResponse } from '@/types/notification';

/**
 * Notification State Interface
 * Defines all state properties and action methods
 */
interface NotificationState {
  // State properties
  notifications: Notification[];        // List of notifications
  unreadCount: number;                 // Number of unread notifications
  total: number;                       // Total notifications count
  page: number;                       // Current page number
  totalPages: number;                 // Total pages available
  loading: boolean;                    // Loading state
  error: string | null;                // Error message
  filters: NotificationFilters;         // Current filter settings
  selectedIds: string[];              // Selected notification IDs for bulk actions
  
  // Actions - Methods to modify state
  setNotifications: (response: NotificationResponse) => void;    // Set notifications from API response
  addNotification: (notification: Notification) => void;          // Add new notification
  markAsRead: (id: string) => void;                             // Mark single notification as read
  markAsUnread: (id: string) => void;                           // Mark single notification as unread
  deleteNotification: (id: string) => void;                     // Delete single notification
  setFilters: (filters: Partial<NotificationFilters>) => void;  // Update filter settings
  toggleSelection: (id: string) => void;                        // Toggle notification selection
  selectAll: () => void;                                        // Select all notifications
  clearSelection: () => void;                                   // Clear all selections
  setLoading: (loading: boolean) => void;                       // Set loading state
  setError: (error: string | null) => void;                     // Set error message
  setUnreadCount: (count: number) => void;                     // Set unread count
  clearNotifications: () => void;                                // Clear all notifications
}

/**
 * Notification Store
 * 
 * @example
 * // In component
 * const { notifications, unreadCount, markAsRead } = useNotificationStore();
 * 
 * // Mark as read
 * markAsRead('notification-id');
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  // ============================================================
  // INITIAL STATE
  // Default values when store is first created
  // ============================================================
  
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  totalPages: 0,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  selectedIds: [],

  // ============================================================
  // SET NOTIFICATIONS
  // Updates all notification data from API response
  // ============================================================
  
  /**
   * Set notifications from API response
   * Typically called after fetching from the API
   * 
   * @param {NotificationResponse} response - API response with notifications and pagination
   */
  setNotifications: (response: NotificationResponse) => 
    set({
      notifications: response.notifications,
      unreadCount: response.unreadCount,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
      loading: false,
      error: null
    }),

  // ============================================================
  // ADD NOTIFICATION
  // Prepends new notification to the list
  // ============================================================
  
  /**
   * Add a new notification to the top of the list
   * Automatically adjusts unread count if notification is unread
   * 
   * @param {Notification} notification - New notification to add
   */
  addNotification: (notification: Notification) =>
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
      total: state.total + 1
    })),

  // ============================================================
  // MARK AS READ / UNREAD
  // Toggle read status for single notifications
  // ============================================================
  
  /**
   * Mark a notification as read
   * Updates the notification in list and decrements unread count
   * 
   * @param {string} id - Notification ID
   */
  markAsRead: (id: string) =>
    set(state => {
      const target = state.notifications.find(n => n.id === id);
      const shouldDecrement = !!target && !target.isRead;

      return {
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: shouldDecrement ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }),

  /**
   * Mark a notification as unread
   * Updates the notification in list and increments unread count
   * 
   * @param {string} id - Notification ID
   */
  markAsUnread: (id: string) =>
    set(state => {
      const target = state.notifications.find(n => n.id === id);
      const shouldIncrement = !!target && target.isRead;

      return {
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: false } : n
        ),
        unreadCount: shouldIncrement ? state.unreadCount + 1 : state.unreadCount
      };
    }),

  // ============================================================
  // DELETE NOTIFICATION
  // Removes notification from the list
  // ============================================================
  
  /**
   * Delete a single notification
   * Adjusts unread count if deleting an unread notification
   * Removes from selectedIds if selected
   * 
   * @param {string} id - Notification ID to delete
   */
  deleteNotification: (id: string) =>
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        total: Math.max(0, state.total - 1),
        selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
      };
    }),

  // ============================================================
  // FILTER ACTIONS
  // Update and manage notification filters
  // ============================================================
  
  /**
   * Update filter settings
   * Merges new filters with existing ones
   * Clears selection when filters change (since visible items change)
   * 
   * @param {Partial<NotificationFilters>} newFilters - Filters to update
   */
  setFilters: (newFilters: Partial<NotificationFilters>) =>
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      selectedIds: [] // Clear selection when filters change
    })),

  // ============================================================
  // SELECTION ACTIONS
  // Manage bulk selection of notifications
  // ============================================================
  
  /**
   * Toggle selection of a notification
   * Adds to selection if not selected, removes if selected
   * 
   * @param {string} id - Notification ID
   */
  toggleSelection: (id: string) =>
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(selectedId => selectedId !== id)
        : [...state.selectedIds, id]
    })),

  /**
   * Select all notifications currently visible
   * Only selects notifications in the current filters/page
   * 
   * @example
   * // Select all on current page for bulk mark as read
   * selectAll();
   */
  selectAll: () =>
    set(state => ({
      selectedIds: state.notifications.map(n => n.id)
    })),

  /**
   * Clear all selected notifications
   */
  clearSelection: () =>
    set({ selectedIds: [] }),

  // ============================================================
  // UTILITY ACTIONS
  // Loading, error, and state management
  // ============================================================
  
  /**
   * Set loading state
   * Should be true when making API calls
   * 
   * @param {boolean} loading - Loading state
   */
  setLoading: (loading: boolean) =>
    set({ loading }),

  /**
   * Set error message
   * Also sets loading to false
   * 
   * @param {string | null} error - Error message
   */
  setError: (error: string | null) =>
    set({ error, loading: false }),

  /**
   * Set unread notification count directly
   * Useful for updating badge without refetching
   * 
   * @param {number} count - New unread count
   */
  setUnreadCount: (unreadCount: number) =>
    set({ unreadCount }),

  /**
   * Clear all notifications and reset state
   * Used when user logs out
   */
  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      totalPages: 0,
      selectedIds: []
    })
}));