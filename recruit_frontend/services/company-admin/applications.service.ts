import apiClient from "@/lib/api-client";
import type { CompanyAdminApplication } from "./types";

// Dùng cho màn company-admin/applications.
export const companyAdminApplicationsService = {
  getApplications: async (chiNhanhId: number): Promise<CompanyAdminApplication[]> => {
    const response = await apiClient.get("/company-admin/applications", {
      params: { chiNhanhId },
    });
    return response.data.data as CompanyAdminApplication[];
  },

  getApplicationDetail: async (applicationId: number): Promise<CompanyAdminApplication> => {
    const response = await apiClient.get(`/company-admin/applications/${applicationId}`);
    return response.data.data as CompanyAdminApplication;
  },

  updateApplicationStatus: async (
    applicationId: number,
    trangThai: string
  ): Promise<CompanyAdminApplication> => {
    const response = await apiClient.patch(`/company-admin/applications/${applicationId}/status`, {
      trangThai,
    });
    return response.data.data as CompanyAdminApplication;
  },
};
