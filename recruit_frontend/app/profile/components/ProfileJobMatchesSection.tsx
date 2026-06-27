"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Sparkles } from "lucide-react";
import type { CandidateRecommendedJob } from "@/services/candidate/candidate-profile.service";
import { useProfileJobMatches } from "../hooks/useProfileJobMatches";

function formatMatchScore(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${Math.round(value)}% phù hợp`;
}

function formatDeadline(value: string | null) {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function JobMatchCard({ job }: { job: CandidateRecommendedJob }) {
  const matchScore = formatMatchScore(job.diemPhuHop);
  const signals = (job.tinHieuKhop ?? []).filter(Boolean);

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

          {signals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              {signals.map((signal) => (
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

export function ProfileJobMatchesSection({ activeProfileId }: { activeProfileId: number }) {
  const { jobs, loading, error } = useProfileJobMatches(activeProfileId);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">AI Matching</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Việc làm phù hợp với hồ sơ này</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gợi ý dựa trên kỹ năng, kinh nghiệm và ngành nghề trong hồ sơ đang chọn.
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải gợi ý việc làm...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">
            Chưa có gợi ý phù hợp. Hãy bổ sung thêm kỹ năng, kinh nghiệm và nhấn{" "}
            <span className="font-semibold text-slate-700">Lưu hồ sơ</span> để cập nhật chỉ mục AI.
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobMatchCard key={job.tinTuyenDungId} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
