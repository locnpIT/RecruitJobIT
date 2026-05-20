import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
import type { AdminCompany, AdminCompanyDetail, ReviewCompanyPayload } from "./types";

// Dùng cho màn admin/companies.
export const adminCompaniesService = {
  listCompanies: async (params?: { status?: string }): Promise<AdminCompany[]> => {
    const response = await apiClient.get("/admin/companies", { params });
    return response.data.data as AdminCompany[];
  },

  getCompanyDetail: async (companyId: number): Promise<AdminCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.get(`/admin/companies/${safeCompanyId}`);
    return response.data.data as AdminCompanyDetail;
  },

  approveCompany: async (companyId: number): Promise<AdminCompany> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.patch(`/admin/companies/${safeCompanyId}/approve`);
    return response.data.data as AdminCompany;
  },

  rejectCompany: async (companyId: number, payload: ReviewCompanyPayload): Promise<AdminCompany> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.patch(`/admin/companies/${safeCompanyId}/reject`, payload);
    return response.data.data as AdminCompany;
  },
};
