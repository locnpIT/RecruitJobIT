"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";
import { PublicJobCard } from "../jobs/components/PublicJobCard";

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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Candidate
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
              Việc làm yêu thích
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Danh sách các tin bạn đã lưu để xem lại và ứng tuyển sau.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Xem thêm việc làm
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Đang tải việc làm yêu thích...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && jobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-950">Bạn chưa lưu tin tuyển dụng nào</p>
            <p className="mt-2 text-sm text-slate-600">
              Khi thấy tin phù hợp, hãy bấm “Lưu tin tuyển dụng” để quay lại sau.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tìm việc ngay
            </Link>
          </div>
        ) : null}

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
