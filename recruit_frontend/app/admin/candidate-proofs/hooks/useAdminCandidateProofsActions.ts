"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCandidateProofsService } from "@/services/admin/candidate-proofs.service";
import type { AdminCandidateProof } from "@/services/admin/types";

type UseAdminCandidateProofsActionsOptions = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/candidate-proofs: duyệt và từ chối minh chứng.
export function useAdminCandidateProofsActions({ onReload }: UseAdminCandidateProofsActionsOptions) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);

  const handleApprove = async (item: AdminCandidateProof) => {
    const rowId = `${item.loai}-${item.id}`;
    setSubmittingId(rowId);
    setMutationError(null);
    setMutationSuccess(null);
    try {
      await adminCandidateProofsService.approveCandidateProof(item.loai, item.id);
      setMutationSuccess("Đã duyệt minh chứng ứng viên.");
      await onReload();
    } catch (error) {
      setMutationError(getApiErrorMessage(error, "Duyệt minh chứng thất bại."));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleBulkApprove = async (items: AdminCandidateProof[]) => {
    if (items.length === 0) {
      setMutationError("Vui lòng chọn ít nhất một minh chứng để duyệt.");
      return false;
    }

    const confirmed = window.confirm(`Duyệt ${items.length} minh chứng đã chọn?`);
    if (!confirmed) return false;

    setSubmittingId("BULK");
    setMutationError(null);
    setMutationSuccess(null);
    try {
      await Promise.all(items.map((item) => adminCandidateProofsService.approveCandidateProof(item.loai, item.id)));
      setMutationSuccess(`Đã duyệt ${items.length} minh chứng ứng viên.`);
      await onReload();
      return true;
    } catch (error) {
      setMutationError(getApiErrorMessage(error, "Duyệt hàng loạt minh chứng thất bại."));
      return false;
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (item: AdminCandidateProof) => {
    const rowId = `${item.loai}-${item.id}`;
    setSubmittingId(rowId);
    setMutationError(null);
    setMutationSuccess(null);
    try {
      await adminCandidateProofsService.rejectCandidateProof(item.loai, item.id);
      setMutationSuccess("Đã từ chối minh chứng ứng viên.");
      await onReload();
    } catch (error) {
      setMutationError(getApiErrorMessage(error, "Từ chối minh chứng thất bại."));
    } finally {
      setSubmittingId(null);
    }
  };

  return {
    submittingId,
    mutationError,
    mutationSuccess,
    setMutationError,
    setMutationSuccess,
    handleApprove,
    handleBulkApprove,
    handleReject,
  };
}
