import apiClient from "@/lib/api-client";
import { requirePathParam } from "./_shared/path-param";

export type CandidateJobApplication = {
  id: number;
  tinTuyenDungId: number;
  tieuDeTinTuyenDung: string | null;
  hoSoUngVienId: number;
  trangThai: string;
  cvUrl: string | null;
  batBuocCV: boolean;
  mauCvUrl: string | null;
  ngayTao: string | null;
};

export type CandidateJobApplicationStatus = {
  tinTuyenDungId: number;
  daUngTuyen: boolean;
  donUngTuyen: CandidateJobApplication | null;
};

export type CreateJobApplicationPayload = {
  hoSoUngVienId: number;
  cvUrl?: string;
};

// Service ứng tuyển của candidate.
// Backend enforce rule: luôn phải chọn hồ sơ; nếu tin bắt buộc CV thì cvUrl là bắt buộc.
export const candidateApplicationService = {
  getApplicationStatus: async (jobId: string | number): Promise<CandidateJobApplicationStatus> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.get(`/candidate/applications/jobs/${safeJobId}/status`);
    return response.data.data as CandidateJobApplicationStatus;
  },

  applyToJob: async (
    jobId: string | number,
    payload: CreateJobApplicationPayload
  ): Promise<CandidateJobApplication> => {
    const safeJobId = requirePathParam(jobId, "jobId");
    const response = await apiClient.post(`/candidate/applications/jobs/${safeJobId}`, payload);
    return response.data.data as CandidateJobApplication;
  },

  listMyApplications: async (): Promise<CandidateJobApplication[]> => {
    const response = await apiClient.get("/candidate/applications");
    return response.data.data as CandidateJobApplication[];
  },
};
