import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";

// Service API hồ sơ ứng viên (candidate):
// hỗ trợ multi-profile + CRUD học vấn/chứng chỉ/kỹ năng/tóm tắt hồ sơ.
export interface CandidateEducationItem {
  id: number;
  duocChon: boolean;
  tenTruong: string;
  chuyenNganh: string | null;
  bacHoc: string | null;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CandidateWorkExperienceItem {
  id: number;
  duocChon: boolean;
  tenCongTy: string;
  chucDanh: string | null;
  moTaCongViec: string | null;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
}

export interface CandidateCertificateItem {
  id: number;
  duocChon: boolean;
  loaiChungChiId: number | null;
  loaiChungChiTen: string | null;
  tenChungChi: string;
  ngayBatDau: string | null;
  ngayHetHan: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CandidateSkillItem {
  id: number;
  duocChon: boolean;
  ten: string;
}

export interface CandidateIndustryItem {
  id: number;
  ten: string;
}

export interface CandidateProfile {
  hoSoUngVienId: number;
  tenHoSo: string | null;
  gioiThieuBanThan: string | null;
  mucTieuNgheNghiep: string | null;
  hocVans: CandidateEducationItem[];
  kinhNghiems: CandidateWorkExperienceItem[];
  chungChis: CandidateCertificateItem[];
  kyNangs: CandidateSkillItem[];
  nganhNghes: CandidateIndustryItem[];
}

export interface CandidateOptionItem {
  id: number;
  ten: string;
}

export interface CandidateProfileMetadata {
  kyNangs: CandidateOptionItem[];
  nganhNghes: CandidateOptionItem[];
  loaiChungChis: CandidateOptionItem[];
}

export interface CandidateProfileListItem {
  id: number;
  tenHoSo: string | null;
  tieuDe: string;
  mucTieuNgheNghiep: string | null;
  gioiThieuBanThan: string | null;
  ngayCapNhat: string | null;
}

export interface UpsertEducationPayload {
  tenTruong: string;
  chuyenNganh?: string;
  bacHoc?: string;
  thoiGianBatDau?: string;
  thoiGianKetThuc?: string;
  duongDanTep?: string;
}

export interface UpsertCertificatePayload {
  loaiChungChiId: number;
  tenChungChi: string;
  ngayBatDau?: string;
  ngayHetHan?: string;
  duongDanTep?: string;
}

export interface UpsertWorkExperiencePayload {
  tenCongTy: string;
  chucDanh?: string;
  moTaCongViec?: string;
  thoiGianBatDau?: string;
  thoiGianKetThuc?: string;
}

export interface ProfileItemSelectionResponse {
  profileId: number;
  itemId: number;
  loai: string;
  duocChon: boolean;
}

export interface CandidateRecommendedJob {
  tinTuyenDungId: number;
  tieuDe: string;
  trangThai: string | null;
  congTyTen: string | null;
  congTyLogoUrl: string | null;
  chiNhanhTen: string | null;
  diaDiem: string | null;
  nganhNghe: string | null;
  loaiHinhLamViec: string | null;
  capDoKinhNghiem: string | null;
  denHanLuc: string | null;
  diemPhuHop: number | null;
  tinHieuKhop: string[];
  canKiemTraThem: string[];
}

export const candidateProfileService = {
  getProfile: async (): Promise<CandidateProfile> => {
    const response = await apiClient.get("/candidate/profile");
    return response.data.data as CandidateProfile;
  },

  listProfiles: async (): Promise<CandidateProfileListItem[]> => {
    const response = await apiClient.get("/candidate/profile/all");
    return response.data.data as CandidateProfileListItem[];
  },

  listRecommendedJobs: async (limit = 6): Promise<CandidateRecommendedJob[]> => {
    const response = await apiClient.get("/candidate/profile/recommended-jobs", {
      params: { limit },
    });
    return response.data.data as CandidateRecommendedJob[];
  },

  createProfile: async (payload?: {
    tenHoSo?: string;
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfileListItem> => {
    const response = await apiClient.post("/candidate/profile/all", payload ?? {});
    return response.data.data as CandidateProfileListItem;
  },

  getProfileById: async (profileId: number): Promise<CandidateProfile> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.get(`/candidate/profile/${safeProfileId}`);
    return response.data.data as CandidateProfile;
  },

  syncProfileIndex: async (profileId?: number | null): Promise<CandidateProfile> => {
    const response = profileId
      ? await apiClient.post(`/candidate/profile/${requirePathParam(profileId, "profileId")}/sync-index`)
      : await apiClient.post("/candidate/profile/sync-index");
    return response.data.data as CandidateProfile;
  },

  getMetadata: async (): Promise<CandidateProfileMetadata> => {
    const response = await apiClient.get("/candidate/profile/metadata");
    return response.data.data as CandidateProfileMetadata;
  },

  createEducation: async (payload: UpsertEducationPayload): Promise<CandidateEducationItem> => {
    const response = await apiClient.post("/candidate/profile/educations", payload);
    return response.data.data as CandidateEducationItem;
  },

  createEducationByProfile: async (profileId: number, payload: UpsertEducationPayload): Promise<CandidateEducationItem> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.post(`/candidate/profile/${safeProfileId}/educations`, payload);
    return response.data.data as CandidateEducationItem;
  },

  updateEducation: async (educationId: number, payload: UpsertEducationPayload): Promise<CandidateEducationItem> => {
    const safeEducationId = requirePathParam(educationId, "educationId");
    const response = await apiClient.patch(`/candidate/profile/educations/${safeEducationId}`, payload);
    return response.data.data as CandidateEducationItem;
  },

  deleteEducation: async (educationId: number): Promise<void> => {
    const safeEducationId = requirePathParam(educationId, "educationId");
    await apiClient.delete(`/candidate/profile/educations/${safeEducationId}`);
  },

  deleteEducationByProfile: async (profileId: number, educationId: number): Promise<void> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeEducationId = requirePathParam(educationId, "educationId");
    await apiClient.delete(`/candidate/profile/${safeProfileId}/educations/${safeEducationId}`);
  },

  createWorkExperience: async (payload: UpsertWorkExperiencePayload): Promise<CandidateWorkExperienceItem> => {
    const response = await apiClient.post("/candidate/profile/experiences", payload);
    return response.data.data as CandidateWorkExperienceItem;
  },

  createWorkExperienceByProfile: async (
    profileId: number,
    payload: UpsertWorkExperiencePayload
  ): Promise<CandidateWorkExperienceItem> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.post(`/candidate/profile/${safeProfileId}/experiences`, payload);
    return response.data.data as CandidateWorkExperienceItem;
  },

  updateWorkExperience: async (
    experienceId: number,
    payload: UpsertWorkExperiencePayload
  ): Promise<CandidateWorkExperienceItem> => {
    const safeExperienceId = requirePathParam(experienceId, "experienceId");
    const response = await apiClient.patch(`/candidate/profile/experiences/${safeExperienceId}`, payload);
    return response.data.data as CandidateWorkExperienceItem;
  },

  updateWorkExperienceByProfile: async (
    profileId: number,
    experienceId: number,
    payload: UpsertWorkExperiencePayload
  ): Promise<CandidateWorkExperienceItem> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeExperienceId = requirePathParam(experienceId, "experienceId");
    const response = await apiClient.patch(`/candidate/profile/${safeProfileId}/experiences/${safeExperienceId}`, payload);
    return response.data.data as CandidateWorkExperienceItem;
  },

  deleteWorkExperience: async (experienceId: number): Promise<void> => {
    const safeExperienceId = requirePathParam(experienceId, "experienceId");
    await apiClient.delete(`/candidate/profile/experiences/${safeExperienceId}`);
  },

  deleteWorkExperienceByProfile: async (profileId: number, experienceId: number): Promise<void> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeExperienceId = requirePathParam(experienceId, "experienceId");
    await apiClient.delete(`/candidate/profile/${safeProfileId}/experiences/${safeExperienceId}`);
  },

  createCertificate: async (payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const response = await apiClient.post("/candidate/profile/certificates", payload);
    return response.data.data as CandidateCertificateItem;
  },

  createCertificateByProfile: async (profileId: number, payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.post(`/candidate/profile/${safeProfileId}/certificates`, payload);
    return response.data.data as CandidateCertificateItem;
  },

  updateCertificate: async (certificateId: number, payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const safeCertificateId = requirePathParam(certificateId, "certificateId");
    const response = await apiClient.patch(`/candidate/profile/certificates/${safeCertificateId}`, payload);
    return response.data.data as CandidateCertificateItem;
  },

  deleteCertificate: async (certificateId: number): Promise<void> => {
    const safeCertificateId = requirePathParam(certificateId, "certificateId");
    await apiClient.delete(`/candidate/profile/certificates/${safeCertificateId}`);
  },

  deleteCertificateByProfile: async (profileId: number, certificateId: number): Promise<void> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeCertificateId = requirePathParam(certificateId, "certificateId");
    await apiClient.delete(`/candidate/profile/${safeProfileId}/certificates/${safeCertificateId}`);
  },

  updateSkills: async (kyNangIds: number[]): Promise<CandidateSkillItem[]> => {
    const response = await apiClient.put("/candidate/profile/skills", { kyNangIds });
    return response.data.data as CandidateSkillItem[];
  },

  updateSkillsByProfile: async (profileId: number, kyNangIds: number[]): Promise<CandidateSkillItem[]> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.put(`/candidate/profile/${safeProfileId}/skills`, { kyNangIds });
    return response.data.data as CandidateSkillItem[];
  },

  updateIndustries: async (nganhNgheIds: number[]): Promise<CandidateIndustryItem[]> => {
    const response = await apiClient.put("/candidate/profile/industries", { nganhNgheIds });
    return response.data.data as CandidateIndustryItem[];
  },

  updateIndustriesByProfile: async (profileId: number, nganhNgheIds: number[]): Promise<CandidateIndustryItem[]> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.put(`/candidate/profile/${safeProfileId}/industries`, { nganhNgheIds });
    return response.data.data as CandidateIndustryItem[];
  },

  updateSummary: async (payload: {
    tenHoSo?: string;
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfile> => {
    const response = await apiClient.patch("/candidate/profile/summary", payload);
    return response.data.data as CandidateProfile;
  },

  updateSummaryByProfile: async (profileId: number, payload: {
    tenHoSo?: string;
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfile> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const response = await apiClient.patch(`/candidate/profile/${safeProfileId}/summary`, payload);
    return response.data.data as CandidateProfile;
  },

  updateEducationSelectionByProfile: async (
    profileId: number,
    educationId: number,
    duocChon: boolean,
  ): Promise<ProfileItemSelectionResponse> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeEducationId = requirePathParam(educationId, "educationId");
    const response = await apiClient.put(
      `/candidate/profile/${safeProfileId}/educations/${safeEducationId}/selection`,
      { duocChon },
    );
    return response.data.data as ProfileItemSelectionResponse;
  },

  updateExperienceSelectionByProfile: async (
    profileId: number,
    experienceId: number,
    duocChon: boolean,
  ): Promise<ProfileItemSelectionResponse> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeExperienceId = requirePathParam(experienceId, "experienceId");
    const response = await apiClient.put(
      `/candidate/profile/${safeProfileId}/experiences/${safeExperienceId}/selection`,
      { duocChon },
    );
    return response.data.data as ProfileItemSelectionResponse;
  },

  updateCertificateSelectionByProfile: async (
    profileId: number,
    certificateId: number,
    duocChon: boolean,
  ): Promise<ProfileItemSelectionResponse> => {
    const safeProfileId = requirePathParam(profileId, "profileId");
    const safeCertificateId = requirePathParam(certificateId, "certificateId");
    const response = await apiClient.put(
      `/candidate/profile/${safeProfileId}/certificates/${safeCertificateId}/selection`,
      { duocChon },
    );
    return response.data.data as ProfileItemSelectionResponse;
  },

};
