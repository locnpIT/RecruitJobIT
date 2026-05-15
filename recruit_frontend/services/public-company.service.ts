import apiClient from "@/lib/api-client";

export type PublicTopCompany = {
  id: number;
  ten: string;
  duongDanLogo: string | null;
};

export const publicCompanyService = {
  listTopCompanies: async (gioiHan = 8): Promise<PublicTopCompany[]> => {
    const response = await apiClient.get("/public/companies/top", { params: { gioiHan } });
    return response.data.data as PublicTopCompany[];
  },
};
