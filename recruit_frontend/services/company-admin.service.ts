import apiClient from "@/lib/api-client";

// Service API cho khu vực công ty (/company-admin):
// profile công ty, HR, jobs, branches, proofs, packages, payment, applications.
export interface CompanyAdminUser {
  id: number | null;
  email: string | null;
  ten: string | null;
  ho: string | null;
  vaiTroHeThong: string | null;
  dangHoatDong: boolean | null;
}

export interface CompanyAdminCompany {
  id: number | null;
  ten: string | null;
  maSoThue: string | null;
  website: string | null;
  moTa: string | null;
  logoUrl: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  coQuyenDangBai: boolean | null;
  goiDangBaiTen: string | null;
  goiDangBaiHetHanLuc: string | null;
  goiDangBaiTrangThai: string | null;
  goiDangBaiTrangThaiThanhToan: string | null;
}

export interface CompanyPackagePlan {
  id: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  moTa: string | null;
  giaNiemYet: number | null;
  soNgayHieuLuc: number | null;
}

export interface CompanyPackageRegistration {
  id: number | null;
  congTyId: number | null;
  danhMucGoiId: number | null;
  maGoi: string | null;
  tenGoi: string | null;
  trangThai: string | null;
  trangThaiThanhToan: string | null;
  batDauLuc: string | null;
  hetHanLuc: string | null;
  giaTaiThoiDiemDangKy: number | null;
  ngayTao: string | null;
  coHieuLuc: boolean | null;
  paymentGateway?: string | null;
  paymentCode?: string | null;
  transferContent?: string | null;
  qrImageUrl?: string | null;
  checkoutFormAction?: string | null;
  checkoutFormFields?: Record<string, string> | null;
}

export interface CompanyPackageOverview {
  danhSachGoi: CompanyPackagePlan[];
  goiHienTai: CompanyPackageRegistration | null;
  coQuyenDangBai: boolean | null;
}

export interface CompanyAdminProof {
  id: number | null;
  tenTep: string | null;
  duongDanTep: string | null;
  loaiTaiLieu: string | null;
  trangThai: string | null;
  lyDoTuChoi: string | null;
  ngayTao: string | null;
}

export interface CompanyProofType {
  id: number | null;
  ten: string | null;
  moTa: string | null;
}

export interface CompanyProofUploadItemPayload {
  loaiTaiLieuId: number;
  duongDanTep: string;
  tenTep?: string;
}

export interface CompanyAdminBranch {
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  vaiTroCongTy: string | null;
  laTruSoChinh: boolean | null;
  trangThai: string | null;
}

export interface CompanyAdminMeResponse {
  nguoiDung: CompanyAdminUser;
  congTy: CompanyAdminCompany;
  chiNhanhs: CompanyAdminBranch[];
}

export interface CompanyAdminJob {
  id: number | null;
  tieuDe: string | null;
  trangThai: string | null;
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  moTa: string | null;
  yeuCau: string | null;
  phucLoi: string | null;
  batBuocCV: boolean | null;
  mauCvUrl: string | null;
  nganhNgheId: number | null;
  nganhNgheTen: string | null;
  loaiHinhLamViecId: number | null;
  loaiHinhLamViecTen: string | null;
  capDoKinhNghiemId: number | null;
  capDoKinhNghiemTen: string | null;
  luongToiThieu: number | null;
  luongToiDa: number | null;
  soLuongTuyen: number | null;
  lyDoTuChoi: string | null;
  denHanLuc: string | null;
  ngayTao: string | null;
  kyNangs?: CompanyJobSkillItem[];
}

export interface CompanyJobMetadataOption {
  id: number | null;
  ten: string | null;
}

export interface CompanyJobSkillItem {
  id: number | null;
  ten: string | null;
}

export interface CompanyJobMetadata {
  nganhNghes: CompanyJobMetadataOption[];
  loaiHinhLamViecs: CompanyJobMetadataOption[];
  capDoKinhNghiems: CompanyJobMetadataOption[];
  kyNangs: CompanyJobMetadataOption[];
}

export interface CompanyAdminApplication {
  id: number | null;
  trangThai: string | null;
  cvUrl: string | null;
  ngayTao: string | null;
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  congTyId: number | null;
  congTyTen: string | null;
  tinTuyenDungId: number | null;
  tieuDeTinTuyenDung: string | null;
  nguoiDungId: number | null;
  ungVienHoTen: string | null;
  ungVienEmail: string | null;
  ungVienSoDienThoai: string | null;
  ungVienAnhDaiDienUrl: string | null;
  hoSoUngVienId: number | null;
  gioiThieuBanThan: string | null;
  mucTieuNgheNghiep: string | null;
  hocVans?: CompanyAdminApplicationEducation[];
  chungChis?: CompanyAdminApplicationCertificate[];
  kyNangs?: CompanyAdminApplicationSkill[];
}

export interface CompanyAdminApplicationEducation {
  id: number | null;
  tenTruong: string | null;
  chuyenNganh: string | null;
  bacHoc: string | null;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CompanyAdminApplicationCertificate {
  id: number | null;
  loaiChungChiId: number | null;
  loaiChungChiTen: string | null;
  tenChungChi: string | null;
  ngayBatDau: string | null;
  ngayHetHan: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CompanyAdminApplicationSkill {
  id: number | null;
  ten: string | null;
}

export interface CompanyAdminHrBranch {
  chiNhanhId: number | null;
  chiNhanhTen: string | null;
  laTruSoChinh: boolean | null;
}

export interface CompanyAdminHrAccount {
  nguoiDungId: number | null;
  email: string | null;
  ten: string | null;
  ho: string | null;
  soDienThoai: string | null;
  vaiTroHeThong: string | null;
  vaiTroCongTy: string | null;
  dangHoatDong: boolean | null;
  matKhauTam: string | null;
  chiNhanhs: CompanyAdminHrBranch[];
}

export interface CreateCompanyHrPayload {
  email: string;
  ten: string;
  ho: string;
  soDienThoai?: string;
  matKhau: string;
  chiNhanhIds: number[];
}

export interface UpdateCompanyHrPayload {
  email: string;
  ten: string;
  ho: string;
  soDienThoai?: string;
  dangHoatDong?: boolean;
  chiNhanhIds: number[];
}

export interface CreateCompanyJobPayload {
  chiNhanhId: number;
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecId: number;
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
  kyNangIds?: number[];
}

export interface UpdateCompanyJobPayload {
  tieuDe: string;
  nganhNgheId: number;
  moTa: string;
  yeuCau: string;
  phucLoi?: string;
  batBuocCV?: boolean;
  mauCvUrl?: string;
  loaiHinhLamViecId: number;
  capDoKinhNghiemId: number;
  luongToiThieu?: number;
  luongToiDa?: number;
  soLuongTuyen: number;
  denHanLuc?: string;
  kyNangIds?: number[];
}

export const companyAdminService = {
  getMe: async (): Promise<CompanyAdminMeResponse> => {
    const response = await apiClient.get("/company-admin/me");
    return response.data.data as CompanyAdminMeResponse;
  },

  getCompanyProofTypes: async (): Promise<CompanyProofType[]> => {
    const response = await apiClient.get("/company-admin/company/proof-types");
    return response.data.data as CompanyProofType[];
  },

  getCompanyPackages: async (): Promise<CompanyPackageOverview> => {
    const response = await apiClient.get("/company-admin/packages");
    return response.data.data as CompanyPackageOverview;
  },

  registerCompanyPackage: async (danhMucGoiId: number): Promise<CompanyPackageRegistration> => {
    const response = await apiClient.post("/company-admin/packages", { danhMucGoiId });
    return response.data.data as CompanyPackageRegistration;
  },

  getBranches: async (): Promise<CompanyAdminBranch[]> => {
    const response = await apiClient.get("/company-admin/branches");
    return response.data.data as CompanyAdminBranch[];
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

  getJobs: async (chiNhanhId: number): Promise<CompanyAdminJob[]> => {
    const response = await apiClient.get("/company-admin/jobs", {
      params: { chiNhanhId },
    });
    return response.data.data as CompanyAdminJob[];
  },

  getJobMetadata: async (): Promise<CompanyJobMetadata> => {
    const response = await apiClient.get("/company-admin/jobs/metadata");
    return response.data.data as CompanyJobMetadata;
  },

  createJob: async (payload: CreateCompanyJobPayload): Promise<CompanyAdminJob> => {
    const response = await apiClient.post("/company-admin/jobs", payload);
    return response.data.data as CompanyAdminJob;
  },

  updateJob: async (jobId: number, payload: UpdateCompanyJobPayload): Promise<CompanyAdminJob> => {
    const response = await apiClient.patch(`/company-admin/jobs/${jobId}`, payload);
    return response.data.data as CompanyAdminJob;
  },

  deleteJob: async (jobId: number): Promise<void> => {
    await apiClient.delete(`/company-admin/jobs/${jobId}`);
  },

  getApplications: async (chiNhanhId: number): Promise<CompanyAdminApplication[]> => {
    const response = await apiClient.get("/company-admin/applications", {
      params: { chiNhanhId },
    });
    return response.data.data as CompanyAdminApplication[];
  },

  getApplicationDetail: async (applicationId: number): Promise<CompanyAdminApplication> => {
    const response = await apiClient.get(`/company-admin/applications/${applicationId}`);
    return response.data.data as CompanyAdminApplication;
  },

  updateApplicationStatus: async (
    applicationId: number,
    trangThai: string
  ): Promise<CompanyAdminApplication> => {
    const response = await apiClient.patch(`/company-admin/applications/${applicationId}/status`, {
      trangThai,
    });
    return response.data.data as CompanyAdminApplication;
  },

  getHrs: async (): Promise<CompanyAdminHrAccount[]> => {
    const response = await apiClient.get("/company-admin/hrs");
    return response.data.data as CompanyAdminHrAccount[];
  },

  createHr: async (payload: CreateCompanyHrPayload): Promise<CompanyAdminHrAccount> => {
    const response = await apiClient.post("/company-admin/hrs", payload);
    return response.data.data as CompanyAdminHrAccount;
  },

  updateHr: async (hrUserId: number, payload: UpdateCompanyHrPayload): Promise<CompanyAdminHrAccount> => {
    const response = await apiClient.patch(`/company-admin/hrs/${hrUserId}`, payload);
    return response.data.data as CompanyAdminHrAccount;
  },

  deleteHr: async (hrUserId: number): Promise<void> => {
    await apiClient.delete(`/company-admin/hrs/${hrUserId}`);
  },
};
