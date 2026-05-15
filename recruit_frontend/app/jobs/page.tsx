"use client";

import { useEffect, useState } from "react";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";
import { PublicJobCard } from "./components/PublicJobCard";

// Trang danh sách việc làm public.
// Hiện chưa bật search/filter theo quyết định PM; trang này chỉ gọi API list job public thật.
export default function JobsPage() {
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .listJobs({ gioiHan: 30 })
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

        setError("Không tải được danh sách việc làm. Vui lòng thử lại.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Việc làm đang tuyển
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
            Danh sách tin tuyển dụng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chỉ hiển thị các tin đã được admin duyệt, còn hạn nộp và thuộc công ty đã xác minh.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Đang tải danh sách việc làm...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && jobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Hiện chưa có tin tuyển dụng public nào phù hợp.
          </div>
        ) : null}

        {!isLoading && !error && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <PublicJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : null}
      </main>
      <HomeFooter />
    </div>
  );
}
