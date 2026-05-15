import apiClient from "@/lib/api-client";

export type PublicTopCompany = {
  id: number;
  ten: string;
  logoUrl: string | null;
};

export const publicCompanyService = {
  listTopCompanies: async (limit = 8): Promise<PublicTopCompany[]> => {
    const response = await apiClient.get("/public/companies/top", { params: { limit } });
    return response.data.data as PublicTopCompany[];
  },
};
