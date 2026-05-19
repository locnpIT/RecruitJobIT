"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";

type LocalUser = {
  vaiTro?: string;
};

// Dùng cho màn /favorite-jobs: kiểm tra session candidate và quản lý danh sách job yêu thích.
export function useFavoriteJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState("");
  const [removingJobId, setRemovingJobId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? (JSON.parse(rawUser) as LocalUser) : null;

        if (!token || (expiresAt !== null && expiresAt <= Date.now()) || user?.vaiTro?.toUpperCase() !== "CANDIDATE") {
          clearAdminSession();
          router.replace("/auth/login");
          return;
        }

        setSessionChecked(true);
      } catch {
        clearAdminSession();
        router.replace("/auth/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) {
      return;
    }

    let isMounted = true;
    publicJobService
      .listFavoriteJobs()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setJobs(data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setError("Không tải được danh sách việc làm yêu thích.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionChecked]);

  const handleRemoveFavorite = async (job: PublicJobSummary) => {
    setRemovingJobId(job.id);
    try {
      await publicJobService.removeFavorite(job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } finally {
      setRemovingJobId(null);
    }
  };

  return {
    jobs,
    isLoading,
    error,
    removingJobId,
    handleRemoveFavorite,
  };
}
