import apiClient from "@/lib/api-client";
import type {
  CompanyAdminBranch,
  CompanyAdminCompany,
  CompanyAdminMeResponse,
  CompanyAdminProof,
  CompanyProofType,
  CompanyProofUploadItemPayload,
} from "./types";

// Dùng cho company-admin shell/settings và dữ liệu nền tảng công ty (me, branches, proofs, company info).
export const companyAdminSettingsService = {
  getMe: async (): Promise<CompanyAdminMeResponse> => {
    const response = await apiClient.get("/company-admin/me");
    return response.data.data as CompanyAdminMeResponse;
  },

  getBranches: async (): Promise<CompanyAdminBranch[]> => {
    const response = await apiClient.get("/company-admin/branches");
    return response.data.data as CompanyAdminBranch[];
  },

  getCompanyProofTypes: async (): Promise<CompanyProofType[]> => {
    const response = await apiClient.get("/company-admin/company/proof-types");
    return response.data.data as CompanyProofType[];
  },

  updateCompanyLogo: async (logoUrl: string): Promise<CompanyAdminCompany> => {
    const response = await apiClient.patch("/company-admin/company/logo", { logoUrl });
    return response.data.data as CompanyAdminCompany;
  },

  updateCompanyInfo: async (payload: {
    tenCongTy: string;
    maSoThue?: string;
    website?: string;
    moTaCongTy?: string;
  }): Promise<CompanyAdminCompany> => {
    const response = await apiClient.patch("/company-admin/company/info", payload);
    return response.data.data as CompanyAdminCompany;
  },

  resubmitCompany: async (): Promise<CompanyAdminCompany> => {
    const response = await apiClient.patch("/company-admin/company/resubmit");
    return response.data.data as CompanyAdminCompany;
  },

  uploadCompanyProof: async (payload: {
    loaiTaiLieuId: number;
    duongDanTep: string;
    tenTep?: string;
  }): Promise<CompanyAdminProof> => {
    const response = await apiClient.post("/company-admin/company/proofs", payload);
    return response.data.data as CompanyAdminProof;
  },

  uploadCompanyProofs: async (payload: {
    minhChungs: CompanyProofUploadItemPayload[];
  }): Promise<CompanyAdminProof[]> => {
    const response = await apiClient.post("/company-admin/company/proofs/batch", payload);
    return response.data.data as CompanyAdminProof[];
  },
};
