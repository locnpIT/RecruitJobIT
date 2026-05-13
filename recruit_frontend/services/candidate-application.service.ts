import apiClient from "@/lib/api-client";

export type CandidateJobApplication = {
  id: number;
  tinTuyenDungId: number;
  tieuDeTinTuyenDung: string | null;
  hoSoUngVienId: number;
  trangThai: string;
  cvUrl: string | null;
  batBuocCv: boolean;
  mauCvUrl: string | null;
  ngayTao: string | null;
};

export type CandidateJobApplicationStatus = {
  jobId: number;
  applied: boolean;
  application: CandidateJobApplication | null;
};

export type CreateJobApplicationPayload = {
  hoSoUngVienId: number;
  cvUrl?: string;
};

// Service ứng tuyển của candidate.
// Backend enforce rule: luôn phải chọn hồ sơ; nếu tin bắt buộc CV thì cvUrl là bắt buộc.
export const candidateApplicationService = {
  getApplicationStatus: async (jobId: string | number): Promise<CandidateJobApplicationStatus> => {
    const response = await apiClient.get(`/candidate/applications/jobs/${jobId}/status`);
    return response.data.data as CandidateJobApplicationStatus;
  },

  applyToJob: async (
    jobId: string | number,
    payload: CreateJobApplicationPayload
  ): Promise<CandidateJobApplication> => {
    const response = await apiClient.post(`/candidate/applications/jobs/${jobId}`, payload);
    return response.data.data as CandidateJobApplication;
  },

  listMyApplications: async (): Promise<CandidateJobApplication[]> => {
    const response = await apiClient.get("/candidate/applications");
    return response.data.data as CandidateJobApplication[];
  },
};
