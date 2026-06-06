import apiClient from "@/lib/api-client";
import type { PublicJobSummary } from "@/services/public/public-job.service";
import { requirePathParam } from "@/services/_shared/path-param";

export type PublicTopCompany = {
  id: number;
  ten: string;
  logoUrl: string | null;
};

export type PublicCompanyDetail = {
  id: number;
  ten: string;
  logoUrl: string | null;
  website: string | null;
  moTa: string;
  soTinDang: number;
  chiNhanhs: Array<{
    id: number;
    ten: string;
    diaChi: string | null;
    laTruSoChinh: boolean;
  }>;
};

export const publicCompanyService = {
  listTopCompanies: async (gioiHan = 8): Promise<PublicTopCompany[]> => {
    const response = await apiClient.get("/public/companies/top", { params: { gioiHan } });
    return response.data.data as PublicTopCompany[];
  },

  getCompanyDetail: async (companyId: string | number): Promise<PublicCompanyDetail> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const response = await apiClient.get(`/public/companies/${safeCompanyId}`);
    return response.data.data as PublicCompanyDetail;
  },

  listCompanyJobs: async (
    companyId: string | number,
    gioiHan = 12,
    branchId?: number | null,
  ): Promise<PublicJobSummary[]> => {
    const safeCompanyId = requirePathParam(companyId, "companyId");
    const params: { gioiHan: number; branchId?: number } = { gioiHan };
    if (branchId) {
      params.branchId = branchId;
    }
    const response = await apiClient.get(`/public/companies/${safeCompanyId}/jobs`, { params });
    return response.data.data as PublicJobSummary[];
  },
};
