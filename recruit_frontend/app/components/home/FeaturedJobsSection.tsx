"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publicJobService, type PublicJobSummary } from "@/services/public-job.service";
import type { JobItem } from "./types";

// Section job nổi bật trên homepage.
// Đây là khối giới thiệu nhanh các tin đang tuyển để kéo người dùng đi vào funnel ứng tuyển.
type FeaturedJobsSectionProps = {
  jobs: JobItem[];
};

export function FeaturedJobsSection({ jobs }: FeaturedJobsSectionProps) {
  const [publicJobs, setPublicJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .listJobs({ limit: 4 })
      .then((data) => {
        if (isMounted) {
          setPublicJobs(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPublicJobs([]);
        }
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

  // Dùng API thật nếu có dữ liệu; mock chỉ là fallback để UI không trống khi backend chưa chạy.
  const displayJobs = useMemo(
    () => publicJobs.length > 0 ? publicJobs : jobs.map(mapMockJob),
    [jobs, publicJobs]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Việc làm nổi bật</h2>
        <Link href="/jobs" className="text-sm font-medium text-slate-700 hover:underline">
          Xem toàn bộ
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Đang tải việc làm đã duyệt...
          </div>
        ) : null}

        {displayJobs.map((job) => (
          <article key={job.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {/* Dẫn ứng viên từ danh sách job nổi bật sang trang chi tiết public `/jobs/[id]`. */}
                  <Link href={`/jobs/${job.id}`} className="text-base font-semibold leading-6 hover:underline">
                    {job.tieuDe}
                  </Link>
                  <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium">{job.tag}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{job.congTyTen}</p>
                <p className="text-xs text-slate-500">{job.diaDiem}</p>
              </div>
              <Link
                href={`/jobs/${job.id}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Xem chi tiết
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded bg-slate-100 px-2 py-1">{job.mucLuong}</span>
              <span className="rounded bg-slate-100 px-2 py-1">{job.capDo}</span>
              <span className="rounded bg-slate-100 px-2 py-1">{job.hinhThuc}</span>
              <span className="rounded bg-slate-100 px-2 py-1">Hạn nộp: {job.hanNop}</span>
              <span className="rounded bg-slate-100 px-2 py-1">Mã: {job.maTin ?? job.id}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function mapMockJob(job: JobItem): PublicJobSummary {
  return {
    id: Number(String(job.id).replace(/\D/g, "")) || 0,
    maTin: job.id,
    tieuDe: job.tieuDe,
    congTyTen: job.congTy,
    diaDiem: job.diaDiem,
    mucLuong: job.mucLuong,
    capDo: job.capDo,
    hinhThuc: job.hinhThuc,
    nganhNghe: "Đang cập nhật",
    hanNop: job.hanNop,
    tag: job.tag,
    ngayTao: null,
  };
}
