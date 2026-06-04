"use client";

import { useEffect, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/services/auth/auth.service";
import { candidateApplicationService } from "@/services/candidate/candidate-application.service";
import {
  candidateProfileService,
  type CandidateProfileListItem,
} from "@/services/candidate/candidate-profile.service";
import { chatService } from "@/services/chat/chat.service";
import { publicJobService, type PublicJobDetail } from "@/services/public/public-job.service";

type LocalUser = {
  vaiTro?: string;
};

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

// Dùng cho trang jobs/[id]: nạp dữ liệu chi tiết tin + xử lý actions yêu thích, ứng tuyển, mở chat.
export function useJobDetail(jobId: string) {
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawConfirming, setWithdrawConfirming] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<CandidateProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyNotice, setApplyNotice] = useState("");
  const [isCandidate, setIsCandidate] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpenError, setChatOpenError] = useState("");
  const jobExpiryDate = parseJobExpiryDate(job?.hanNop);
  const isExpired = Boolean(jobExpiryDate && jobExpiryDate < new Date());

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;

        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setIsCandidate(false);
          return;
        }

        const raw = localStorage.getItem("user");
        const user = raw ? (JSON.parse(raw) as LocalUser) : null;
        setIsCandidate(user?.vaiTro?.toUpperCase() === "CANDIDATE");
      } catch {
        clearAdminSession();
        setIsCandidate(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .getJobDetail(jobId)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setJob(data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setError("Tin tuyển dụng không tồn tại, chưa được duyệt hoặc đã hết hạn.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!isCandidate || !job?.id) {
      return;
    }

    let isMounted = true;
    publicJobService
      .getFavoriteStatus(job.id)
      .then((data) => {
        if (isMounted) {
          setIsFavorite(Boolean(data.daYeuThich));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsFavorite(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCandidate, job?.id]);

  useEffect(() => {
    if (!isCandidate || !job?.id) {
      return;
    }

    let isMounted = true;
    candidateApplicationService
      .getApplicationStatus(job.id)
      .then((data) => {
        if (isMounted) {
          setHasApplied(Boolean(data.daUngTuyen));
          setApplicationId(data.donUngTuyen?.id ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasApplied(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setApplicationLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCandidate, job?.id]);

  const handleToggleFavorite = async () => {
    if (!job?.id) {
      return;
    }
    if (!isCandidate) {
      window.location.href = "/auth/login";
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = isFavorite
        ? await publicJobService.removeFavorite(job.id)
        : await publicJobService.addFavorite(job.id);
      setIsFavorite(Boolean(response.daYeuThich));
    } catch {
      // Giữ hành vi cũ: không show thêm toast/error khi toggle favorite fail.
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleOpenApplyModal = async () => {
    if (!job?.id) {
      return;
    }
    if (!isCandidate) {
      window.location.href = "/auth/login";
      return;
    }
    if (isExpired) {
      return;
    }
    if (hasApplied) {
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
      setHasApplied(false);
      setApplicationId(null);
      setWithdrawConfirming(false);
    } catch (err) {
      setWithdrawError(getApiErrorMessage(err, "Không thể huỷ đơn ứng tuyển. Vui lòng thử lại."));
    } finally {
      setWithdrawLoading(false);
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
      setHasApplied(true);
      setApplyModalOpen(false);
      setCvFile(null);
      setApplyNotice("Ứng tuyển thành công. Nhà tuyển dụng sẽ xem hồ sơ của bạn trong hệ thống.");
    } catch (submitError) {
      setApplyError(getApiErrorMessage(submitError, "Không thể gửi ứng tuyển. Vui lòng kiểm tra thông tin và thử lại."));
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleOpenChat = async () => {
    if (!job?.id) {
      return;
    }
    if (!isCandidate) {
      window.location.href = "/auth/login";
      return;
    }

    setChatLoading(true);
    setChatOpenError("");
    try {
      const conversation = await chatService.openByJob(job.id);
      window.location.assign(`/messages?cuocTroChuyenId=${conversation.id}`);
    } catch (chatError) {
      setChatOpenError(getApiErrorMessage(chatError, "Không thể mở cuộc trò chuyện với nhà tuyển dụng."));
    } finally {
      setChatLoading(false);
    }
  };

  return {
    job,
    isExpired,
    isLoading,
    error,
    isFavorite,
    favoriteLoading,
    applicationLoading,
    hasApplied,
    applyModalOpen,
    profiles,
    selectedProfileId,
    cvFile,
    applySubmitting,
    applyError,
    applyNotice,
    chatLoading,
    chatOpenError,
    setApplyModalOpen,
    setSelectedProfileId,
    setCvFile,
    handleToggleFavorite,
    handleOpenApplyModal,
    handleSubmitApplication,
    handleOpenChat,
    withdrawConfirming,
    withdrawLoading,
    withdrawError,
    handleWithdrawRequest,
    handleWithdrawConfirm,
    handleWithdrawCancel,
  };
}
