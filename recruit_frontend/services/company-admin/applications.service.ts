import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
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
    const safeApplicationId = requirePathParam(applicationId, "applicationId");
    const response = await apiClient.get(`/company-admin/applications/${safeApplicationId}`);
    return response.data.data as CompanyAdminApplication;
  },

  updateApplicationStatus: async (
    applicationId: number,
    trangThai: string
  ): Promise<CompanyAdminApplication> => {
    const safeApplicationId = requirePathParam(applicationId, "applicationId");
    const response = await apiClient.patch(`/company-admin/applications/${safeApplicationId}/status`, {
      trangThai,
    });
    return response.data.data as CompanyAdminApplication;
  },
};
