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
  danhSach: NotificationItem[];
  trang: number;
  kichThuoc: number;
  tongPhanTu: number;
  tongSoTrang: number;
  conTrangSau: boolean;
}

export interface NotificationUnreadCountResponse {
  soChuaDoc: number;
}

export const notificationService = {
  list: async (trang = 0, kichThuoc = 20): Promise<NotificationListResponse> => {
    const response = await apiClient.get("/notifications", { params: { trang, kichThuoc } });
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

  markAllRead: async (): Promise<{ soDaCapNhat: number }> => {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data.data as { soDaCapNhat: number };
  },

  delete: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
