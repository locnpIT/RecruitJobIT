import apiClient from "@/lib/api-client";
import type { AdminCandidateProof } from "./types";

// Dùng cho màn admin/candidate-proofs.
export const adminCandidateProofsService = {
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
};
