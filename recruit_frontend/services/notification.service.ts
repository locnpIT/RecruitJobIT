import apiClient from "@/lib/api-client";

export interface NotificationItem {
  id: number;
  tieuDe: string;
  noiDung: string;
  duongDan: string | null;
  daDoc: boolean;
  ngayTao: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export const notificationService = {
  list: async (page = 0, size = 20): Promise<NotificationListResponse> => {
    const response = await apiClient.get("/notifications", { params: { page, size } });
    return response.data.data as NotificationListResponse;
  },

  unreadCount: async (): Promise<NotificationUnreadCountResponse> => {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data.data as NotificationUnreadCountResponse;
  },

  markRead: async (notificationId: number): Promise<NotificationItem> => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data.data as NotificationItem;
  },

  markAllRead: async (): Promise<{ updatedCount: number }> => {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data.data as { updatedCount: number };
  },

  delete: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
