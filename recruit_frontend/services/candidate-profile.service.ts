import apiClient from "@/lib/api-client";

// Service API hồ sơ ứng viên (candidate):
// hỗ trợ multi-profile + CRUD học vấn/chứng chỉ/kỹ năng/tóm tắt hồ sơ.
export interface CandidateEducationItem {
  id: number;
  tenTruong: string;
  chuyenNganh: string | null;
  bacHoc: string | null;
  thoiGianBatDau: string | null;
  thoiGianKetThuc: string | null;
  duongDanTep: string | null;
  trangThai: string | null;
}

export interface CandidateCertificateItem {
  id: number;
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
  ten: string;
}

export interface CandidateProfile {
  hoSoUngVienId: number;
  gioiThieuBanThan: string | null;
  mucTieuNgheNghiep: string | null;
  hocVans: CandidateEducationItem[];
  chungChis: CandidateCertificateItem[];
  kyNangs: CandidateSkillItem[];
}

export interface CandidateOptionItem {
  id: number;
  ten: string;
}

export interface CandidateProfileMetadata {
  kyNangs: CandidateOptionItem[];
  loaiChungChis: CandidateOptionItem[];
}

export interface CandidateProfileListItem {
  id: number;
  title: string;
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

export const candidateProfileService = {
  getProfile: async (): Promise<CandidateProfile> => {
    const response = await apiClient.get("/candidate/profile");
    return response.data.data as CandidateProfile;
  },

  listProfiles: async (): Promise<CandidateProfileListItem[]> => {
    const response = await apiClient.get("/candidate/profile/all");
    return response.data.data as CandidateProfileListItem[];
  },

  createProfile: async (payload?: {
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfileListItem> => {
    const response = await apiClient.post("/candidate/profile/all", payload ?? {});
    return response.data.data as CandidateProfileListItem;
  },

  getProfileById: async (profileId: number): Promise<CandidateProfile> => {
    const response = await apiClient.get(`/candidate/profile/${profileId}`);
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
    const response = await apiClient.post(`/candidate/profile/${profileId}/educations`, payload);
    return response.data.data as CandidateEducationItem;
  },

  updateEducation: async (educationId: number, payload: UpsertEducationPayload): Promise<CandidateEducationItem> => {
    const response = await apiClient.patch(`/candidate/profile/educations/${educationId}`, payload);
    return response.data.data as CandidateEducationItem;
  },

  deleteEducation: async (educationId: number): Promise<void> => {
    await apiClient.delete(`/candidate/profile/educations/${educationId}`);
  },

  deleteEducationByProfile: async (profileId: number, educationId: number): Promise<void> => {
    await apiClient.delete(`/candidate/profile/${profileId}/educations/${educationId}`);
  },

  createCertificate: async (payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const response = await apiClient.post("/candidate/profile/certificates", payload);
    return response.data.data as CandidateCertificateItem;
  },

  createCertificateByProfile: async (profileId: number, payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const response = await apiClient.post(`/candidate/profile/${profileId}/certificates`, payload);
    return response.data.data as CandidateCertificateItem;
  },

  updateCertificate: async (certificateId: number, payload: UpsertCertificatePayload): Promise<CandidateCertificateItem> => {
    const response = await apiClient.patch(`/candidate/profile/certificates/${certificateId}`, payload);
    return response.data.data as CandidateCertificateItem;
  },

  deleteCertificate: async (certificateId: number): Promise<void> => {
    await apiClient.delete(`/candidate/profile/certificates/${certificateId}`);
  },

  deleteCertificateByProfile: async (profileId: number, certificateId: number): Promise<void> => {
    await apiClient.delete(`/candidate/profile/${profileId}/certificates/${certificateId}`);
  },

  updateSkills: async (kyNangIds: number[]): Promise<CandidateSkillItem[]> => {
    const response = await apiClient.put("/candidate/profile/skills", { kyNangIds });
    return response.data.data as CandidateSkillItem[];
  },

  updateSkillsByProfile: async (profileId: number, kyNangIds: number[]): Promise<CandidateSkillItem[]> => {
    const response = await apiClient.put(`/candidate/profile/${profileId}/skills`, { kyNangIds });
    return response.data.data as CandidateSkillItem[];
  },

  updateSummary: async (payload: {
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfile> => {
    const response = await apiClient.patch("/candidate/profile/summary", payload);
    return response.data.data as CandidateProfile;
  },

  updateSummaryByProfile: async (profileId: number, payload: {
    gioiThieuBanThan?: string;
    mucTieuNgheNghiep?: string;
  }): Promise<CandidateProfile> => {
    const response = await apiClient.patch(`/candidate/profile/${profileId}/summary`, payload);
    return response.data.data as CandidateProfile;
  },
};
