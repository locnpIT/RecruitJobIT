import apiClient from "@/lib/api-client";
import type { AdminCompany, AdminCompanyDetail, ReviewCompanyPayload } from "./types";

// Dùng cho màn admin/companies.
export const adminCompaniesService = {
  listCompanies: async (params?: { status?: string }): Promise<AdminCompany[]> => {
    const response = await apiClient.get("/admin/companies", { params });
    return response.data.data as AdminCompany[];
  },

  getCompanyDetail: async (companyId: number): Promise<AdminCompanyDetail> => {
    const response = await apiClient.get(`/admin/companies/${companyId}`);
    return response.data.data as AdminCompanyDetail;
  },

  approveCompany: async (companyId: number): Promise<AdminCompany> => {
    const response = await apiClient.patch(`/admin/companies/${companyId}/approve`);
    return response.data.data as AdminCompany;
  },

  rejectCompany: async (companyId: number, payload: ReviewCompanyPayload): Promise<AdminCompany> => {
    const response = await apiClient.patch(`/admin/companies/${companyId}/reject`, payload);
    return response.data.data as AdminCompany;
  },
};
