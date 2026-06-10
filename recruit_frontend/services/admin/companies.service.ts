import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";
import type {
  AdminCompany,
  AdminCompanyDetail,
  CreateAdminCompanyPayload,
  ReviewCompanyPayload,
  UpdateAdminCompanyBranchPayload,
  UpdateAdminCompanyPayload,
} from "./types";

// Dùng cho màn admin/companies.
export const adminCompaniesService = {
  listCompanies: async (params?: { status?: string; keyword?: string }): Promise<AdminCompany[]> => {
    const response = await apiClient.get("/admin/companies", { params });
    return response.data.data as AdminCompany[];
  },

  createCompany: async (payload: CreateAdminCompanyPayload): Promise<AdminCompany> => {
    const response = await apiClient.post("/admin/companies", payload);
    return response.data.data as AdminCompany;
  },

  getCompanyDetail: async (companyId: number): Promise<AdminCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.get(`/admin/companies/${safeCompanyId}`);
    return response.data.data as AdminCompanyDetail;
  },

  createCompanyBranch: async (companyId: number, payload: UpdateAdminCompanyBranchPayload): Promise<AdminCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.post(`/admin/companies/${safeCompanyId}/branches`, payload);
    return response.data.data as AdminCompanyDetail;
  },

  updateCompany: async (companyId: number, payload: UpdateAdminCompanyPayload): Promise<AdminCompany> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.patch(`/admin/companies/${safeCompanyId}`, payload);
    return response.data.data as AdminCompany;
  },

  updateCompanyBranch: async (
    companyId: number,
    branchId: number,
    payload: UpdateAdminCompanyBranchPayload,
  ): Promise<AdminCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const safeBranchId = requirePathParam(branchId, "branchId");
    const response = await apiClient.patch(`/admin/companies/${safeCompanyId}/branches/${safeBranchId}`, payload);
    return response.data.data as AdminCompanyDetail;
  },

  deleteCompany: async (companyId: number): Promise<void> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    await apiClient.delete(`/admin/companies/${safeCompanyId}`);
  },

  deleteCompanyBranch: async (companyId: number, branchId: number): Promise<AdminCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const safeBranchId = requirePathParam(branchId, "branchId");
    const response = await apiClient.delete(`/admin/companies/${safeCompanyId}/branches/${safeBranchId}`);
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
