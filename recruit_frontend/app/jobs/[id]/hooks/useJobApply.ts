"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth/auth.service";
import { candidateApplicationService } from "@/services/candidate/candidate-application.service";
import {
  candidateProfileService,
  type CandidateProfileListItem,
} from "@/services/candidate/candidate-profile.service";
import type { PublicJobDetail } from "@/services/public/public-job.service";

type UseJobApplyOptions = {
  job: PublicJobDetail | null;
  isCandidate: boolean;
  isExpired: boolean;
  hasApplied: boolean;
  applicationId: number | null;
  onApplySuccess: () => void;
  onWithdrawSuccess: () => void;
};

// Xử lý toàn bộ luồng ứng tuyển: mở modal, nộp hồ sơ, và rút đơn.
export function useJobApply({
  job,
  isCandidate,
  isExpired,
  hasApplied,
  applicationId,
  onApplySuccess,
  onWithdrawSuccess,
}: UseJobApplyOptions) {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<CandidateProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyNotice, setApplyNotice] = useState("");

  const [withdrawConfirming, setWithdrawConfirming] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const handleOpenApplyModal = async () => {
    if (!job?.id || !isCandidate) {
      if (!isCandidate) {
        window.location.href = "/auth/login";
      }
      return;
    }
    if (isExpired || hasApplied) {
      return;
    }

    setApplyError("");
    setApplyNotice("");
    setApplyModalOpen(true);

    if (profiles.length === 0) {
      try {
        const data = await candidateProfileService.listProfiles();
        setProfiles(data);
        if (data.length === 1) {
          setSelectedProfileId(String(data[0].id));
        }
      } catch (profileError) {
        setApplyError(getApiErrorMessage(profileError, "Không tải được danh sách hồ sơ ứng viên."));
      }
    }
  };

  const handleSubmitApplication = async () => {
    if (!job?.id) {
      return;
    }
    if (!selectedProfileId) {
      setApplyError("Vui lòng chọn hồ sơ ứng viên.");
      return;
    }
    if (job.batBuocCV && !cvFile) {
      setApplyError("Tin này bắt buộc nộp file CV.");
      return;
    }

    setApplySubmitting(true);
    setApplyError("");
    try {
      let cvUrl: string | undefined;
      if (job.batBuocCV && cvFile) {
        const signature = await authService.getCloudinarySignature("proof");
        cvUrl = await authService.uploadToCloudinary(cvFile, signature);
      }

      await candidateApplicationService.applyToJob(job.id, {
        hoSoUngVienId: Number(selectedProfileId),
        cvUrl,
      });

      onApplySuccess();
      setApplyModalOpen(false);
      setCvFile(null);
      setApplyNotice("Ứng tuyển thành công. Nhà tuyển dụng sẽ xem hồ sơ của bạn trong hệ thống.");
    } catch (submitError) {
      setApplyError(
        getApiErrorMessage(submitError, "Không thể gửi ứng tuyển. Vui lòng kiểm tra thông tin và thử lại.")
      );
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleWithdrawRequest = () => {
    setWithdrawError("");
    setWithdrawConfirming(true);
  };

  const handleWithdrawCancel = () => {
    setWithdrawConfirming(false);
    setWithdrawError("");
  };

  const handleWithdrawConfirm = async () => {
    if (!applicationId) {
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError("");
    try {
      await candidateApplicationService.withdrawApplication(applicationId);
      onWithdrawSuccess();
      setWithdrawConfirming(false);
    } catch (err) {
      setWithdrawError(getApiErrorMessage(err, "Không thể huỷ đơn ứng tuyển. Vui lòng thử lại."));
    } finally {
      setWithdrawLoading(false);
    }
  };

  return {
    applyModalOpen,
    setApplyModalOpen,
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    cvFile,
    setCvFile,
    applySubmitting,
    applyError,
    applyNotice,
    withdrawConfirming,
    withdrawLoading,
    withdrawError,
    handleOpenApplyModal,
    handleSubmitApplication,
    handleWithdrawRequest,
    handleWithdrawCancel,
    handleWithdrawConfirm,
  };
}
