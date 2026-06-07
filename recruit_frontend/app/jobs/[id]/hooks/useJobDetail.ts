"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { chatService } from "@/services/chat/chat.service";
import { publicJobService } from "@/services/public/public-job.service";
import { useJobApply } from "./useJobApply";
import { useJobData } from "./useJobData";

const parseJobExpiryDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const expiry = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
  return Number.isNaN(expiry.getTime()) ? null : expiry;
};

// Orchestrator: kết hợp useJobData + useJobApply, thêm toggle yêu thích và mở chat.
export function useJobDetail(jobId: string) {
  const data = useJobData(jobId);

  const jobExpiryDate = parseJobExpiryDate(data.job?.hanNop);
  const isExpired = Boolean(jobExpiryDate && jobExpiryDate < new Date());

  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpenError, setChatOpenError] = useState("");

  const apply = useJobApply({
    job: data.job,
    isCandidate: data.isCandidate,
    isExpired,
    hasApplied: data.hasApplied,
    applicationId: data.applicationId,
    onApplySuccess: () => {
      data.setHasApplied(true);
    },
    onWithdrawSuccess: () => {
      data.setHasApplied(false);
      data.setApplicationId(null);
    },
  });

  const handleToggleFavorite = async () => {
    if (!data.job?.id) {
      return;
    }
    if (!data.isCandidate) {
      window.location.href = "/auth/login";
      return;
    }

    data.setFavoriteLoading(true);
    try {
      const response = data.isFavorite
        ? await publicJobService.removeFavorite(data.job.id)
        : await publicJobService.addFavorite(data.job.id);
      data.setIsFavorite(Boolean(response.daYeuThich));
    } catch {
      // Giữ hành vi cũ: không show thêm toast/error khi toggle favorite fail.
    } finally {
      data.setFavoriteLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (!data.job?.id) {
      return;
    }
    if (!data.isCandidate) {
      window.location.href = "/auth/login";
      return;
    }

    setChatLoading(true);
    setChatOpenError("");
    try {
      const conversation = await chatService.openByJob(data.job.id);
      window.location.assign(`/messages?cuocTroChuyenId=${conversation.id}`);
    } catch (chatError) {
      setChatOpenError(getApiErrorMessage(chatError, "Không thể mở cuộc trò chuyện với nhà tuyển dụng."));
    } finally {
      setChatLoading(false);
    }
  };

  return {
    job: data.job,
    isExpired,
    isLoading: data.isLoading,
    error: data.error,
    isFavorite: data.isFavorite,
    favoriteLoading: data.favoriteLoading,
    applicationLoading: data.applicationLoading,
    hasApplied: data.hasApplied,
    applyModalOpen: apply.applyModalOpen,
    profiles: apply.profiles,
    selectedProfileId: apply.selectedProfileId,
    cvFile: apply.cvFile,
    applySubmitting: apply.applySubmitting,
    applyError: apply.applyError,
    applyNotice: apply.applyNotice,
    chatLoading,
    chatOpenError,
    setApplyModalOpen: apply.setApplyModalOpen,
    setSelectedProfileId: apply.setSelectedProfileId,
    setCvFile: apply.setCvFile,
    handleToggleFavorite,
    handleOpenApplyModal: apply.handleOpenApplyModal,
    handleSubmitApplication: apply.handleSubmitApplication,
    handleOpenChat,
    withdrawConfirming: apply.withdrawConfirming,
    withdrawLoading: apply.withdrawLoading,
    withdrawError: apply.withdrawError,
    handleWithdrawRequest: apply.handleWithdrawRequest,
    handleWithdrawConfirm: apply.handleWithdrawConfirm,
    handleWithdrawCancel: apply.handleWithdrawCancel,
  };
}
