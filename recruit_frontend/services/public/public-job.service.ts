import apiClient from "@/lib/api-client";
import { requirePathParam } from "@/services/_shared/path-param";

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

export type AiSearchJobsPayload = {
  prompt: string;
  gioiHan?: number;
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

const AI_SEARCH_CACHE_TTL_MS = 30_000;
const aiSearchInflightRequests = new Map<string, Promise<PublicJobSearchResponse>>();
const aiSearchResponseCache = new Map<string, { data: PublicJobSearchResponse; createdAt: number }>();

function buildAiSearchCacheKey(payload: AiSearchJobsPayload) {
  return `${payload.prompt.trim().toLowerCase()}::${payload.gioiHan ?? ""}`;
}

async function postAiSearchJobs(payload: AiSearchJobsPayload): Promise<PublicJobSearchResponse> {
  const cacheKey = buildAiSearchCacheKey(payload);
  const cached = aiSearchResponseCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < AI_SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  const inflightRequest = aiSearchInflightRequests.get(cacheKey);
  if (inflightRequest) {
    return inflightRequest;
  }

  // Dedupe POST AI search để React StrictMode/dev remount không gọi Gemini 2 lần cho cùng prompt.
  const request = apiClient
    .post("/public/jobs/ai-search", payload)
    .then((response) => {
      const data = response.data.data as PublicJobSearchResponse;
      aiSearchResponseCache.set(cacheKey, { data, createdAt: Date.now() });
      return data;
    })
    .finally(() => {
      aiSearchInflightRequests.delete(cacheKey);
    });

  aiSearchInflightRequests.set(cacheKey, request);
  return request;
}

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

  aiSearchJobs: async (payload: AiSearchJobsPayload): Promise<PublicJobSearchResponse> => {
    return postAiSearchJobs(payload);
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
