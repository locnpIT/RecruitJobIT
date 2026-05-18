import apiClient from "@/lib/api-client";
import type { PublicJobSummary } from "@/services/public-job.service";

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
};

export const publicCompanyService = {
  listTopCompanies: async (gioiHan = 8): Promise<PublicTopCompany[]> => {
    const response = await apiClient.get("/public/companies/top", { params: { gioiHan } });
    return response.data.data as PublicTopCompany[];
  },

  getCompanyDetail: async (companyId: string | number): Promise<PublicCompanyDetail> => {
    const response = await apiClient.get(`/public/companies/${companyId}`);
    return response.data.data as PublicCompanyDetail;
  },

  listCompanyJobs: async (companyId: string | number, gioiHan = 12): Promise<PublicJobSummary[]> => {
    const response = await apiClient.get(`/public/companies/${companyId}/jobs`, { params: { gioiHan } });
    return response.data.data as PublicJobSummary[];
  },
};
