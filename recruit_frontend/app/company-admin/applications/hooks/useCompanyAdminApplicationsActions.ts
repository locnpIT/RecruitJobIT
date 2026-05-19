"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { chatService } from "@/services/chat.service";
import { companyAdminApplicationsService } from "@/services/company-admin/applications.service";
import type { CompanyAdminApplication } from "@/services/company-admin/types";

type UseCompanyAdminApplicationsActionsOptions = {
  setApplications: Dispatch<SetStateAction<CompanyAdminApplication[]>>;
  setError: Dispatch<SetStateAction<string>>;
};

// Dùng cho màn company-admin/applications: mở detail, đổi trạng thái và mở chat với ứng viên.
export function useCompanyAdminApplicationsActions({ setApplications, setError }: UseCompanyAdminApplicationsActionsOptions) {
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] = useState<CompanyAdminApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [openingChatApplicationId, setOpeningChatApplicationId] = useState<number | null>(null);

  const handleOpenDetail = async (applicationId: number | null) => {
    if (!applicationId) {
      return;
    }

    setDetailOpen(true);
    setIsLoadingDetail(true);
    setSelectedApplication(null);

    try {
      const detail = await companyAdminApplicationsService.getApplicationDetail(applicationId);
      setSelectedApplication(detail);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không tải được chi tiết đơn ứng tuyển."));
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

  const handleOpenChat = async (applicationId: number | null) => {
    if (!applicationId) {
      return;
    }

    setOpeningChatApplicationId(applicationId);
    try {
      const conversation = await chatService.openByApplication(applicationId);
      router.push(`/company-admin/messages?cuocTroChuyenId=${conversation.id}`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể mở cuộc trò chuyện với ứng viên."));
    } finally {
      setOpeningChatApplicationId(null);
    }
  };

  return {
    selectedApplication,
    detailOpen,
    isLoadingDetail,
    isSavingStatus,
    openingChatApplicationId,
    setDetailOpen,
    handleOpenDetail,
    handleStatusChange,
    handleOpenChat,
  };
}
