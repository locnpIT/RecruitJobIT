import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
import type { CompanyAdminHrAccount, CreateCompanyHrPayload, UpdateCompanyHrPayload } from "./types";

// Dùng cho màn company-admin/hr.
export const companyAdminHrService = {
  getHrs: async (): Promise<CompanyAdminHrAccount[]> => {
    const response = await apiClient.get("/company-admin/hrs");
    return response.data.data as CompanyAdminHrAccount[];
  },

  createHr: async (payload: CreateCompanyHrPayload): Promise<CompanyAdminHrAccount> => {
    const response = await apiClient.post("/company-admin/hrs", payload);
    return response.data.data as CompanyAdminHrAccount;
  },

  updateHr: async (hrUserId: number, payload: UpdateCompanyHrPayload): Promise<CompanyAdminHrAccount> => {
    const safeHrUserId = requirePathParam(hrUserId, "hrUserId");
    const response = await apiClient.patch(`/company-admin/hrs/${safeHrUserId}`, payload);
    return response.data.data as CompanyAdminHrAccount;
  },

  deleteHr: async (hrUserId: number): Promise<void> => {
    const safeHrUserId = requirePathParam(hrUserId, "hrUserId");
    await apiClient.delete(`/company-admin/hrs/${safeHrUserId}`);
  },
};
