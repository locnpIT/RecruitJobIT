import apiClient from "@/lib/api-client";

// Service gom toàn bộ API cho khu vực /admin:
// stats, users, companies, plans, jobs, reports, settings.
export interface AdminStatsResponse {
  tongNguoiDung: number;
  nguoiDungHoatDong: number;
  nguoiDungKhongHoatDong: number;
  tongCongTy: number;
  congTyChoDuyet: number;
  congTyDaDuyet: number;
  congTyBiTuChoi: number;
}

export interface AdminUser {
  id: number;
  hoTen: string;
  email: string;
  soDienThoai: string | null;
  vaiTroHeThong: string | null;
  dangHoatDong: boolean;
  trangThai: string;
  congTyTen: string | null;
  vaiTroCongTy: string | null;
  chiNhanhTen: string | null;
  ngayTao: string;
  ngayCapNhat: string;
}

export interface AdminCompany {
  id: number;
  ten: string;
  maSoThue: string;
  website: string | null;
  trangThai: string;
  lyDoTuChoi: string | null;
  chuCongTyHoTen: string | null;
  chuCongTyEmail: string | null;
  soChiNhanh: number;
  minhChungUrl: string | null;
  minhChungTrangThai: string | null;
  minhChungLyDoTuChoi: string | null;
  ngayTao: string;
  ngayCapNhat: string;
}

export interface UpdateUserStatusPayload {
  dangHoatDong: boolean;
}

export interface ReviewCompanyPayload {
  lyDoTuChoi: string;
}

export interface AdminCompanyDetailBranch {
  id: number | null;
  ten: string | null;
  diaChiChiTiet: string | null;
  xaPhuongTen: string | null;
  tinhThanhTen: string | null;
  laTruSoChinh: boolean | null;
  trangThai: string | null;
  ngayTao: string | null;
}

export interface AdminCompanyDetailProofDocument {
  id: number | null;
  tenTep: string | null;
  duongDanTep: string | null;
  loaiTaiLieu: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  ngayTao: string | null;
}

export interface AdminCompanyDetailOwner {
  id: number | null;
  hoTen: string | null;
  email: string | null;
  soDienThoai: string | null;
  dangHoatDong: boolean | null;
}

export interface AdminCompanyDetail {
  congTy: AdminCompany;
  chuCongTy: AdminCompanyDetailOwner;
  chiNhanhs: AdminCompanyDetailBranch[];
  taiLieuMinhChungs: AdminCompanyDetailProofDocument[];
}

export interface AdminPackage {
  id: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  moTa: string | null;
  giaNiemYet: number | null;
  soNgayHieuLuc: number | null;
  soCongTyDangSuDung: number | null;
}

export interface AdminPackageSubscription {
  id: number | null;
  congTy: string | null;
  goi: string | null;
  trangThai: string | null;
  trangThaiThanhToan: string | null;
  batDauLuc: string | null;
  hetHanLuc: string | null;
  giaTaiThoiDiemDangKy: number | null;
  ngayTao: string | null;
  coHieuLuc: boolean | null;
}

export interface AdminCatalogItem {
  id: number | null;
  ten: string | null;
  moTa: string | null;
}

export interface UpsertAdminCatalogItemPayload {
  ten: string;
  moTa?: string;
}

export interface AdminJob {
  id: number;
  tieuDe: string | null;
  congTyTen: string | null;
  chiNhanhTen: string | null;
  diaDiem: string | null;
  nganhNgheTen: string | null;
  capDoKinhNghiemTen: string | null;
  luongToiThieu: number | null;
  luongToiDa: number | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  denHanLuc: string | null;
  ngayTao: string | null;
}

export interface AdminJobDetail {
  tongQuan: AdminJob;
  moTa: string | null;
  yeuCau: string | null;
  phucLoi: string | null;
  batBuocCV: boolean | null;
  mauCvUrl: string | null;
}

export interface AdminCandidateProof {
  id: number;
  hoSoUngVienId: number | null;
  loai: "EDUCATION" | "CERTIFICATE" | string;
  tieuDe: string | null;
  moTa: string | null;
  ungVienHoTen: string | null;
  ungVienEmail: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface ReviewJobPayload {
  lyDoTuChoi: string;
}

export interface CreatePackagePayload {
  tenGoi: string;
  moTa?: string;
  giaNiemYet: number;
  soNgayHieuLuc: number;
}

export interface UpdatePackagePayload {
  tenGoi: string;
  moTa?: string;
  giaNiemYet: number;
  soNgayHieuLuc: number;
}

export const adminService = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get("/admin/stats");
    return response.data.data as AdminStatsResponse;
  },

  listUsers: async (params?: { keyword?: string; role?: string; status?: string }): Promise<AdminUser[]> => {
    const response = await apiClient.get("/admin/users", {
      params,
    });
    return response.data.data as AdminUser[];
  },

  updateUserStatus: async (userId: number, payload: UpdateUserStatusPayload): Promise<AdminUser> => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, payload);
    return response.data.data as AdminUser;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  listCompanies: async (params?: { status?: string }): Promise<AdminCompany[]> => {
    const response = await apiClient.get("/admin/companies", {
      params,
    });
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

  listPackages: async (): Promise<AdminPackage[]> => {
    const response = await apiClient.get("/admin/packages");
    return response.data.data as AdminPackage[];
  },

  listPackageSubscriptions: async (): Promise<AdminPackageSubscription[]> => {
    const response = await apiClient.get("/admin/packages/subscriptions");
    return response.data.data as AdminPackageSubscription[];
  },

  createPackage: async (payload: CreatePackagePayload): Promise<AdminPackage> => {
    const response = await apiClient.post("/admin/packages", payload);
    return response.data.data as AdminPackage;
  },

  updatePackage: async (packageId: number, payload: UpdatePackagePayload): Promise<AdminPackage> => {
    const response = await apiClient.patch(`/admin/packages/${packageId}`, payload);
    return response.data.data as AdminPackage;
  },

  deletePackage: async (packageId: number): Promise<void> => {
    await apiClient.delete(`/admin/packages/${packageId}`);
  },

  listJobs: async (params?: {
    keyword?: string;
    company?: string;
    status?: string;
    industry?: string;
    location?: string;
  }): Promise<AdminJob[]> => {
    const response = await apiClient.get("/admin/jobs", { params });
    return response.data.data as AdminJob[];
  },

  getJobDetail: async (jobId: number): Promise<AdminJobDetail> => {
    const response = await apiClient.get(`/admin/jobs/${jobId}`);
    return response.data.data as AdminJobDetail;
  },

  approveJob: async (jobId: number): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/approve`);
    return response.data.data as AdminJob;
  },

  rejectJob: async (jobId: number, payload: ReviewJobPayload): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/reject`, payload);
    return response.data.data as AdminJob;
  },

  hideJob: async (jobId: number): Promise<AdminJob> => {
    const response = await apiClient.patch(`/admin/jobs/${jobId}/hide`);
    return response.data.data as AdminJob;
  },

  listCandidateProofs: async (params?: { status?: string }): Promise<AdminCandidateProof[]> => {
    const response = await apiClient.get("/admin/candidate-proofs", { params });
    return response.data.data as AdminCandidateProof[];
  },

  approveCandidateProof: async (type: string, proofId: number): Promise<AdminCandidateProof> => {
    const response = await apiClient.patch(`/admin/candidate-proofs/${type}/${proofId}/approve`);
    return response.data.data as AdminCandidateProof;
  },

  rejectCandidateProof: async (type: string, proofId: number): Promise<AdminCandidateProof> => {
    const response = await apiClient.patch(`/admin/candidate-proofs/${type}/${proofId}/reject`);
    return response.data.data as AdminCandidateProof;
  },

  listSystemRoles: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/system-roles");
    return response.data.data as AdminCatalogItem[];
  },

  createSystemRole: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/system-roles", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateSystemRole: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/system-roles/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteSystemRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/system-roles/${id}`);
  },

  listCompanyRoles: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/company-roles");
    return response.data.data as AdminCatalogItem[];
  },

  createCompanyRole: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/company-roles", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateCompanyRole: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/company-roles/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteCompanyRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/company-roles/${id}`);
  },

  listProofTypes: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/proof-types");
    return response.data.data as AdminCatalogItem[];
  },

  createProofType: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/proof-types", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateProofType: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/proof-types/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteProofType: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/proof-types/${id}`);
  },

  listCertificateTypes: async (): Promise<AdminCatalogItem[]> => {
    const response = await apiClient.get("/admin/certificate-types");
    return response.data.data as AdminCatalogItem[];
  },

  createCertificateType: async (payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.post("/admin/certificate-types", payload);
    return response.data.data as AdminCatalogItem;
  },

  updateCertificateType: async (id: number, payload: UpsertAdminCatalogItemPayload): Promise<AdminCatalogItem> => {
    const response = await apiClient.patch(`/admin/certificate-types/${id}`, payload);
    return response.data.data as AdminCatalogItem;
  },

  deleteCertificateType: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/certificate-types/${id}`);
  },
};
