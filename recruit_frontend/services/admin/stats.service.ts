import apiClient from "@/lib/api-client";
import type { AdminReport, AdminStatsResponse } from "./types";

// Dùng cho dashboard và các màn admin cần summary số liệu.
export const adminStatsService = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get("/admin/stats");
    return response.data.data as AdminStatsResponse;
  },

  getReport: async (range: "7d" | "30d" | "90d"): Promise<AdminReport> => {
    const response = await apiClient.get(`/admin/reports?range=${range}`);
    return response.data.data as AdminReport;
  },

  validateSession: async (): Promise<void> => {
    await apiClient.get("/admin/stats");
  },
};
