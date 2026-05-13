import Link from "next/link";
import { BriefcaseBusiness, Heart, MapPin } from "lucide-react";
import type { PublicJobSummary } from "@/services/public-job.service";

type PublicJobCardProps = {
  job: PublicJobSummary;
  actionLabel?: string;
  onAction?: (job: PublicJobSummary) => void;
  actionLoading?: boolean;
};

// Card tin tuyển dụng public dùng chung cho `/jobs` và `/favorite-jobs`.
// Component chỉ nhận dữ liệu đã được backend lọc public-visible: APPROVED, còn hạn, công ty đã duyệt.
export function PublicJobCard({ job, actionLabel, onAction, actionLoading }: PublicJobCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/jobs/${job.id}`} className="text-base font-semibold text-slate-950 hover:underline">
              {job.tieuDe}
            </Link>
            <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {job.tag}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="h-4 w-4" />
              {job.congTyTen}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.diaDiem}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded bg-slate-100 px-2 py-1">{job.mucLuong}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.capDo}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.hinhThuc}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.nganhNghe}</span>
            <span className="rounded bg-slate-100 px-2 py-1">Hạn nộp: {job.hanNop}</span>
            <span className="rounded bg-slate-100 px-2 py-1">Mã: {job.maTin ?? job.id}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {onAction ? (
            <button
              type="button"
              onClick={() => onAction(job)}
              disabled={actionLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <Heart className="h-4 w-4 fill-slate-900" />
              {actionLabel ?? "Bỏ lưu"}
            </button>
          ) : null}

          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
