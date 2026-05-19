import apiClient from "@/lib/api-client";
import type { AdminStatsResponse } from "./types";

// Dùng cho dashboard và các màn admin cần summary số liệu.
export const adminStatsService = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get("/admin/stats");
    return response.data.data as AdminStatsResponse;
  },
};
