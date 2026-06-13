export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_STATUS = 'PAYMENT_STATUS',
  PROMOTION = 'PROMOTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  NEW_ORDER = 'NEW_ORDER',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  isRead?: boolean;
  search?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
}

export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface BulkActionPayload {
  notificationIds: string[];
}
