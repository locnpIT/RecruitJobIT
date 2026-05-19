import apiClient from "@/lib/api-client";
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
    const response = await apiClient.patch(`/company-admin/hrs/${hrUserId}`, payload);
    return response.data.data as CompanyAdminHrAccount;
  },

  deleteHr: async (hrUserId: number): Promise<void> => {
    await apiClient.delete(`/company-admin/hrs/${hrUserId}`);
  },
};
