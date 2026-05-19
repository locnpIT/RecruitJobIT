import apiClient from "@/lib/api-client";
import type {
  CompanyAdminJob,
  CompanyJobMetadata,
  CreateCompanyJobPayload,
  UpdateCompanyJobPayload,
} from "./types";

// Dùng cho màn company-admin/jobs: metadata + CRUD tin tuyển dụng theo chi nhánh.
export const companyAdminJobsService = {
  getJobs: async (chiNhanhId: number): Promise<CompanyAdminJob[]> => {
    const response = await apiClient.get("/company-admin/jobs", {
      params: { chiNhanhId },
    });
    return response.data.data as CompanyAdminJob[];
  },

  getJobMetadata: async (): Promise<CompanyJobMetadata> => {
    const response = await apiClient.get("/company-admin/jobs/metadata");
    return response.data.data as CompanyJobMetadata;
  },

  createJob: async (payload: CreateCompanyJobPayload): Promise<CompanyAdminJob> => {
    const response = await apiClient.post("/company-admin/jobs", payload);
    return response.data.data as CompanyAdminJob;
  },

  updateJob: async (jobId: number, payload: UpdateCompanyJobPayload): Promise<CompanyAdminJob> => {
    const response = await apiClient.patch(`/company-admin/jobs/${jobId}`, payload);
    return response.data.data as CompanyAdminJob;
  },

  deleteJob: async (jobId: number): Promise<void> => {
    await apiClient.delete(`/company-admin/jobs/${jobId}`);
  },
};
