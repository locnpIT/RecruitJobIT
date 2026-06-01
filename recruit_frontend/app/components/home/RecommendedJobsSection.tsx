"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import type { CandidateRecommendedJob } from "@/services/candidate/candidate-profile.service";
import { useRecommendedJobs } from "./hooks/useRecommendedJobs";

function formatMatchScore(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return `${Math.round(value)}% phù hợp`;
}

function formatDeadline(value: string | null) {
  if (!value) {
    return "Đang cập nhật";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Đang cập nhật";
  }
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function RecommendedJobCard({ job }: { job: CandidateRecommendedJob }) {
  const matchScore = formatMatchScore(job.diemPhuHop);
  const topSignals = (job.tinHieuKhop ?? []).filter(Boolean).slice(0, 3);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${job.tinTuyenDungId}`}
              className="text-base font-semibold leading-6 text-slate-950 hover:underline"
            >
              {job.tieuDe}
            </Link>
            {matchScore ? (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {matchScore}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            {job.congTyLogoUrl ? (
              <Image
                src={job.congTyLogoUrl}
                alt={`Logo ${job.congTyTen ?? "công ty"}`}
                width={44}
                height={44}
                className="h-11 w-11 rounded-md border border-slate-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white">
                <Building2 className="h-5 w-5 text-slate-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{job.congTyTen ?? "Công ty đang cập nhật"}</p>
              <p className="truncate text-xs text-slate-500">{job.diaDiem ?? "Địa điểm đang cập nhật"}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded bg-slate-100 px-2 py-1">{job.capDoKinhNghiem ?? "Cấp độ đang cập nhật"}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.loaiHinhLamViec ?? "Hình thức đang cập nhật"}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.nganhNghe ?? "Ngành nghề đang cập nhật"}</span>
            <span className="rounded bg-slate-100 px-2 py-1">Hạn nộp: {formatDeadline(job.denHanLuc)}</span>
          </div>

          {topSignals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              {topSignals.map((signal) => (
                <span key={signal} className="rounded border border-slate-200 bg-white px-2 py-1">
                  {signal}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Link
          href={`/jobs/${job.tinTuyenDungId}`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[#008080] px-4 text-sm font-semibold text-white hover:bg-[#006d6d]"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

export function RecommendedJobsSection() {
  const { jobs, shouldRender } = useRecommendedJobs();

  if (!shouldRender) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Dựa trên hồ sơ ứng viên</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Việc làm phù hợp với tôi</h2>
        </div>
        <Link href="/jobs" className="text-sm font-medium text-slate-700 hover:underline">
          Xem thêm việc làm
        </Link>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <RecommendedJobCard key={job.tinTuyenDungId} job={job} />
        ))}
      </div>
    </section>
  );
}
