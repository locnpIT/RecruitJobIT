import apiClient from "@/lib/api-client";
import type { CompanyPackageOverview, CompanyPackageRegistration } from "./types";

// Dùng cho màn company-admin/packages.
export const companyAdminPackagesService = {
  getCompanyPackages: async (): Promise<CompanyPackageOverview> => {
    const response = await apiClient.get("/company-admin/packages");
    return response.data.data as CompanyPackageOverview;
  },

  registerCompanyPackage: async (danhMucGoiId: number): Promise<CompanyPackageRegistration> => {
    const response = await apiClient.post("/company-admin/packages", { danhMucGoiId });
    return response.data.data as CompanyPackageRegistration;
  },
};
