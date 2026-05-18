"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";
import { PublicJobCard } from "../jobs/components/PublicJobCard";
import { StateCard } from "@/app/components/shared/StateCard";
import { FavoriteJobsEmptyState } from "./components/FavoriteJobsEmptyState";
import { FavoriteJobsHeader } from "./components/FavoriteJobsHeader";

type LocalUser = {
  vaiTro?: string;
};

// Trang riêng để candidate xem các tin tuyển dụng đã yêu thích.
// Dữ liệu lấy từ bảng NguoiDungTinTuyenDung qua API `/candidate/favorite-jobs`.
export default function FavoriteJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState("");
  const [removingJobId, setRemovingJobId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Đọc session sau mount để tránh hydration mismatch và để chặn token hết hạn trước khi gọi API private.
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

  // Bỏ lưu ngay trên trang yêu thích để candidate quản lý danh sách nhanh.
  const handleRemoveFavorite = async (job: PublicJobSummary) => {
    setRemovingJobId(job.id);
    try {
      await publicJobService.removeFavorite(job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } finally {
      setRemovingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <FavoriteJobsHeader />

        {isLoading ? (
          <StateCard message="Đang tải việc làm yêu thích..." paddingClassName="p-5" />
        ) : null}

        {!isLoading && error ? (
          <StateCard message={error} tone="error" paddingClassName="p-5" />
        ) : null}

        {!isLoading && !error && jobs.length === 0 ? <FavoriteJobsEmptyState /> : null}

        {!isLoading && !error && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <PublicJobCard
                key={job.id}
                job={job}
                actionLabel="Bỏ lưu"
                actionLoading={removingJobId === job.id}
                onAction={handleRemoveFavorite}
              />
            ))}
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}
