"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { chatService } from "@/services/chat/chat.service";
import { companyAdminApplicationsService } from "@/services/company-admin/applications.service";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminApplication } from "@/services/company-admin/types";

type UseCompanyAdminApplicationsActionsOptions = {
  setApplications: Dispatch<SetStateAction<CompanyAdminApplication[]>>;
  setError: Dispatch<SetStateAction<string>>;
};

export type CandidateActionTarget = {
  applicationId?: number | null;
  jobId?: number | null;
  profileId?: number | null;
};

// Dùng cho màn company-admin/applications: mở detail, đổi trạng thái và mở chat với ứng viên.
export function useCompanyAdminApplicationsActions({ setApplications, setError }: UseCompanyAdminApplicationsActionsOptions) {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] = useState<CompanyAdminApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSendingInterviewEmail, setIsSendingInterviewEmail] = useState(false);
  const [openingChatApplicationId, setOpeningChatApplicationId] = useState<number | null>(null);
  const [openingChatTargetKey, setOpeningChatTargetKey] = useState<string | null>(null);

  const handleOpenDetail = async (target: CandidateActionTarget | number | null) => {
    const safeTarget = normalizeTarget(target);
    if (!safeTarget.applicationId && (!safeTarget.jobId || !safeTarget.profileId)) {
      return;
    }

    setDetailOpen(true);
    setIsLoadingDetail(true);
    setSelectedApplication(null);

    try {
      const detail = safeTarget.applicationId
        ? await companyAdminApplicationsService.getApplicationDetail(safeTarget.applicationId)
        : await companyAdminJobsService.getCandidateProfileForJob(safeTarget.jobId!, safeTarget.profileId!);
      setSelectedApplication(detail);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không tải được chi tiết hồ sơ ứng viên."));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedApplication?.id) {
      return;
    }

    setIsSavingStatus(true);
    try {
      const updated = await companyAdminApplicationsService.updateApplicationStatus(selectedApplication.id, status);
      setSelectedApplication(updated);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, trangThai: updated.trangThai } : item))
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể cập nhật trạng thái đơn ứng tuyển."));
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSendInterviewEmail = async (payload: {
    thoiGianPhongVan: string;
    diaDiemPhongVan: string;
    ghiChu?: string;
  }) => {
    if (!selectedApplication?.id) {
      return;
    }

    setIsSendingInterviewEmail(true);
    try {
      const updated = await companyAdminApplicationsService.sendInterviewEmail(selectedApplication.id, payload);
      setSelectedApplication(updated);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, trangThai: updated.trangThai } : item))
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể gửi email phỏng vấn."));
    } finally {
      setIsSendingInterviewEmail(false);
    }
  };

  const handleOpenChat = async (target: CandidateActionTarget | number | null) => {
    const safeTarget = normalizeTarget(target);
    if (!safeTarget.applicationId && (!safeTarget.jobId || !safeTarget.profileId)) {
      return;
    }

    const targetKey = buildChatTargetKey(safeTarget);
    setOpeningChatApplicationId(safeTarget.applicationId ?? null);
    setOpeningChatTargetKey(targetKey);
    try {
      const conversation = safeTarget.applicationId
        ? await chatService.openByApplication(safeTarget.applicationId)
        : await chatService.openByCandidateProfile(safeTarget.jobId!, safeTarget.profileId!);
      router.push(`/company-admin/messages?cuocTroChuyenId=${conversation.id}`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể mở cuộc trò chuyện với ứng viên."));
    } finally {
      setOpeningChatApplicationId(null);
      setOpeningChatTargetKey(null);
    }
  };

  return {
    selectedApplication,
    detailOpen,
    isLoadingDetail,
    isSavingStatus,
    isSendingInterviewEmail,
    openingChatApplicationId,
    openingChatTargetKey,
    setDetailOpen,
    handleOpenDetail,
    handleStatusChange,
    handleSendInterviewEmail,
    handleOpenChat,
  };
}

function normalizeTarget(target: CandidateActionTarget | number | null): CandidateActionTarget {
  if (typeof target === "number") {
    return { applicationId: target };
  }
  return target ?? {};
}

function buildChatTargetKey(target: CandidateActionTarget) {
  if (target.applicationId) {
    return `application-${target.applicationId}`;
  }
  return `profile-${target.jobId ?? "unknown"}-${target.profileId ?? "unknown"}`;
}
