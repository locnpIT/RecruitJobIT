import apiClient from "@/lib/api-client";

export type PublicJobSummary = {
  id: number;
  maTin: string | null;
  tieuDe: string;
  congTyTen: string;
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
  trangThai: string;
  congTy: string;
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
  hocVan: string;
  soLuongTuyen: string;
  gioiTinh: string;
  capNhatLuc: string;
  batBuocCv: boolean;
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

// Service public job dùng cho homepage và trang chi tiết job.
// Tất cả API `/public/jobs` chỉ trả về tin APPROVED + còn hạn theo rule backend.
export const publicJobService = {
  listJobs: async (params: ListJobsParams = {}): Promise<PublicJobSummary[]> => {
    const response = await apiClient.get("/public/jobs", { params });
    return response.data.data as PublicJobSummary[];
  },

  getJobDetail: async (jobId: string | number): Promise<PublicJobDetail> => {
    const response = await apiClient.get(`/public/jobs/${jobId}`);
    return response.data.data as PublicJobDetail;
  },

  getFavoriteStatus: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const response = await apiClient.get(`/candidate/favorite-jobs/${jobId}/status`);
    return response.data.data as FavoriteJobStatus;
  },

  addFavorite: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const response = await apiClient.post(`/candidate/favorite-jobs/${jobId}`);
    return response.data.data as FavoriteJobStatus;
  },

  removeFavorite: async (jobId: string | number): Promise<FavoriteJobStatus> => {
    const response = await apiClient.delete(`/candidate/favorite-jobs/${jobId}`);
    return response.data.data as FavoriteJobStatus;
  },

  listFavoriteJobs: async (): Promise<PublicJobSummary[]> => {
    const response = await apiClient.get("/candidate/favorite-jobs");
    return response.data.data as PublicJobSummary[];
  },
};
