import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
import type { AdminUser, CreateAdminUserPayload, UpdateUserStatusPayload } from "./types";

// Dùng cho màn admin/users.
export const adminUsersService = {
  listUsers: async (params?: { keyword?: string; role?: string; status?: string }): Promise<AdminUser[]> => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data.data as AdminUser[];
  },

  createUser: async (payload: CreateAdminUserPayload): Promise<AdminUser> => {
    const response = await apiClient.post("/admin/users", payload);
    return response.data.data as AdminUser;
  },

  updateUserStatus: async (userId: number, payload: UpdateUserStatusPayload): Promise<AdminUser> => {
    const safeUserId = requirePathParam(userId, "userId");
    const response = await apiClient.patch(`/admin/users/${safeUserId}/status`, payload);
    return response.data.data as AdminUser;
  },

  deleteUser: async (userId: number): Promise<void> => {
    const safeUserId = requirePathParam(userId, "userId");
    await apiClient.delete(`/admin/users/${safeUserId}`);
  },
};
