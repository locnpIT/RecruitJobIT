import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
import type {
  CompanyAdminJob,
  CompanyAdminApplication,
  CompanyCandidateSemanticMatch,
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
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.patch(`/company-admin/jobs/${safeJobId}`, payload);
    return response.data.data as CompanyAdminJob;
  },

  deleteJob: async (jobId: number): Promise<void> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    await apiClient.delete(`/company-admin/jobs/${safeJobId}`);
  },

  getCandidateMatches: async (jobId: number, limit = 10): Promise<CompanyCandidateSemanticMatch[]> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/company-admin/jobs/${safeJobId}/candidate-matches`, {
      params: { limit },
    });
    return response.data.data as CompanyCandidateSemanticMatch[];
  },

  getApplicationMatches: async (jobId: number, limit = 10): Promise<CompanyCandidateSemanticMatch[]> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/company-admin/jobs/${safeJobId}/application-matches`, {
      params: { limit },
    });
    return response.data.data as CompanyCandidateSemanticMatch[];
  },

  getCandidateProfileForJob: async (jobId: number, profileId: number): Promise<CompanyAdminApplication> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.get(`/company-admin/jobs/${safeJobId}/candidate-profiles/${safeProfileId}`);
    return response.data.data as CompanyAdminApplication;
  },
};
