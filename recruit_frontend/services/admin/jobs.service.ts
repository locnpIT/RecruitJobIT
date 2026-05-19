import apiClient from "@/lib/api-client";
import type { AdminJob, AdminJobDetail, ReviewJobPayload } from "./types";

// Dùng cho màn admin/jobs.
export const adminJobsService = {
  listJobs: async (params?: {
    keyword?: string;
    company?: string;
    status?: string;
    industry?: string;
    location?: string;
  }): Promise<AdminJob[]> => {
    const response = await apiClient.get("/admin/jobs", { params });
    return response.data.data as AdminJob[];
  },

  getJobDetail: async (jobId: number): Promise<AdminJobDetail> => {
    const response = await apiClient.get(`/admin/jobs/${jobId}`);
    return response.data.data as AdminJobDetail;
  },

  approveJob: async (jobId: number): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/approve`);
    return response.data.data as AdminJob;
  },

  rejectJob: async (jobId: number, payload: ReviewJobPayload): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/reject`, payload);
    return response.data.data as AdminJob;
  },

  hideJob: async (jobId: number): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/hide`);
    return response.data.data as AdminJob;
  },
};
