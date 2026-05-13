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
  title: string;
  status: string;
  company: string;
  companyVerified: boolean;
  industry: string;
  companySize: string;
  website: string | null;
  location: string;
  salary: string;
  level: string;
  workType: string;
  experience: string;
  deadline: string;
  postedAt: string;
  education: string;
  headcount: string;
  gender: string;
  updatedAt: string;
  batBuocCv: boolean;
  mauCvUrl: string | null;
  tags: string[];
  description: string[];
  requirements: string[];
  benefits: string[];
  companyDescription: string;
  similarJobs: PublicJobSummary[];
};

export type FavoriteJobStatus = {
  jobId: number;
  favorite: boolean;
};

type ListJobsParams = {
  keyword?: string;
  location?: string;
  limit?: number;
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
