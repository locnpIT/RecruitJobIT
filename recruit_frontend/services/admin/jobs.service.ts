import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
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
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/admin/jobs/${safeJobId}`);
    return response.data.data as AdminJobDetail;
  },

  approveJob: async (jobId: number): Promise<AdminJob> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.patch(`/admin/jobs/${safeJobId}/approve`);
    return response.data.data as AdminJob;
  },

  rejectJob: async (jobId: number, payload: ReviewJobPayload): Promise<AdminJob> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.patch(`/admin/jobs/${safeJobId}/reject`, payload);
    return response.data.data as AdminJob;
  },

  hideJob: async (jobId: number): Promise<AdminJob> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.patch(`/admin/jobs/${safeJobId}/hide`);
    return response.data.data as AdminJob;
  },
};
