import apiClient from "@/lib/api-client";
import type { AdminUser, UpdateUserStatusPayload } from "./types";

// Dùng cho màn admin/users.
export const adminUsersService = {
  listUsers: async (params?: { keyword?: string; role?: string; status?: string }): Promise<AdminUser[]> => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data.data as AdminUser[];
  },

  updateUserStatus: async (userId: number, payload: UpdateUserStatusPayload): Promise<AdminUser> => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, payload);
    return response.data.data as AdminUser;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },
};
