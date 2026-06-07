"use client";

import { useEffect, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { candidateApplicationService } from "@/services/candidate/candidate-application.service";
import { publicJobService, type PublicJobDetail } from "@/services/public/public-job.service";

type LocalUser = { id: number; vaiTro: string };

// Tải dữ liệu trang job detail: thông tin job, auth role, trạng thái yêu thích và ứng tuyển.
export function useJobData(jobId: string) {
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCandidate, setIsCandidate] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [hasApplied, setHasApplied] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);

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

  return {
    job,
    isLoading,
    error,
    isCandidate,
    isFavorite,
    setIsFavorite,
    favoriteLoading,
    setFavoriteLoading,
    hasApplied,
    setHasApplied,
    applicationLoading,
    applicationId,
    setApplicationId,
  };
}
