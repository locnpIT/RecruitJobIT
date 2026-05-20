import apiClient from "@/lib/api-client";
import { requirePathParam } from "./_shared/path-param";

export type PublicJobSummary = {
  id: number;
  maTin: string | null;
  tieuDe: string;
  congTyId: number | null;
  congTyTen: string;
  logoUrl: string | null;
  diaDiem: string;
  mucLuong: string;
  capDo: string;
  hinhThuc: string;
  nganhNghe: string;
  hanNop: string;
  tag: string;
  ngayTao: string | null;
};

export type PublicJobDetail = {
  id: number;
  maTin: string | null;
  tieuDe: string;
  congTyId: number | null;
  trangThai: string;
  congTy: string;
  logoUrl: string | null;
  congTyDaXacMinh: boolean;
  nhaTuyenDungId: number | null;
  nhaTuyenDungTen: string | null;
  nganhNghe: string;
  quyMoCongTy: string;
  websiteCongTy: string | null;
  diaDiem: string;
  mucLuong: string;
  capDo: string;
  loaiHinhLamViec: string;
  kinhNghiem: string;
  hanNop: string;
  dangLuc: string;
  soLuongTuyen: string;
  capNhatLuc: string;
  batBuocCV: boolean;
  mauCvUrl: string | null;
  the: string[];
  kyNangs: string[];
  moTa: string[];
  yeuCau: string[];
  phucLoi: string[];
  moTaCongTy: string;
  viecLamTuongTu: PublicJobSummary[];
};

export type FavoriteJobStatus = {
  tinTuyenDungId: number;
  daYeuThich: boolean;
};

type ListJobsParams = {
  tuKhoa?: string;
  diaDiem?: string;
  gioiHan?: number;
};

export type SearchJobsParams = {
  tuKhoa?: string;
  diaDiem?: string;
  nganhNgheId?: number;
  loaiHinhLamViecId?: number;
  capDoKinhNghiemId?: number;
  trang?: number;
  kichThuoc?: number;
};

export type PublicJobSearchResponse = {
  danhSach: PublicJobSummary[];
  tongSo: number;
  trang: number;
  kichThuoc: number;
  conTrangSau: boolean;
};

export type PublicJobSearchMetadataOption = {
  id: number;
  ten: string;
};

export type PublicJobSearchMetadata = {
  nganhNghes: PublicJobSearchMetadataOption[];
  loaiHinhLamViecs: PublicJobSearchMetadataOption[];
  capDoKinhNghiems: PublicJobSearchMetadataOption[];
};

// Service public job dùng cho homepage và trang chi tiết job.
// Tất cả API `/public/jobs` chỉ trả về tin APPROVED + còn hạn theo rule backend.
export const publicJobService = {
  listJobs: async (params: ListJobsParams = {}): Promise<PublicJobSummary[]> => {
    const response = await apiClient.get("/public/jobs", { params });
    return response.data.data as PublicJobSummary[];
  },

  getJobDetail: async (jobId: string | number): Promise<PublicJobDetail> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/public/jobs/${safeJobId}`);
    return response.data.data as PublicJobDetail;
  },

  searchJobs: async (params: SearchJobsParams = {}): Promise<PublicJobSearchResponse> => {
    const response = await apiClient.get("/public/jobs/search", { params });
    return response.data.data as PublicJobSearchResponse;
  },

  getSearchMetadata: async (): Promise<PublicJobSearchMetadata> => {
    const response = await apiClient.get("/public/jobs/search/metadata");
    return response.data.data as PublicJobSearchMetadata;
  },

  getFavoriteStatus: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/candidate/favorite-jobs/${safeJobId}/status`);
    return response.data.data as FavoriteJobStatus;
  },

  addFavorite: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.post(`/candidate/favorite-jobs/${safeJobId}`);
    return response.data.data as FavoriteJobStatus;
  },

  removeFavorite: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.delete(`/candidate/favorite-jobs/${safeJobId}`);
    return response.data.data as FavoriteJobStatus;
  },

  listFavoriteJobs: async (): Promise<PublicJobSummary[]> => {
    const response = await apiClient.get("/candidate/favorite-jobs");
    return response.data.data as PublicJobSummary[];
  },
};
