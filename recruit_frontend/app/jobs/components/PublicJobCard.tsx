import Image from "next/image";
import Link from "next/link";
import { Building2, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PublicJobSummary } from "@/services/public/public-job.service";

type PublicJobCardProps = {
  job: PublicJobSummary;
  variant?: "default" | "featured";
  actionLabel?: string;
  onAction?: (job: PublicJobSummary) => void;
  actionLoading?: boolean;
};

// Card tin tuyển dụng public dùng chung cho `/jobs` và `/favorite-jobs`.
// Component chỉ nhận dữ liệu đã được backend lọc public-visible: APPROVED, còn hạn, công ty đã duyệt.
export function PublicJobCard({
  job,
  variant = "default",
  actionLabel,
  onAction,
  actionLoading,
}: PublicJobCardProps) {
  const companyLogoUrl = job.logoUrl;
  const isFeatured = variant === "featured";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/jobs/${job.id}`} className="text-base font-semibold leading-6 text-slate-950 hover:underline">
              {job.tieuDe}
            </Link>
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            {companyLogoUrl ? (
              <Image
                src={companyLogoUrl}
                alt={`Logo ${job.congTyTen}`}
                width={44}
                height={44}
                className="h-11 w-11 rounded-md border border-slate-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white">
                <Building2 className="h-5 w-5 text-slate-500" />
              </div>
            )}
            {job.congTyId ? (
              <Link href={`/companies/${job.congTyId}`} className="hover:underline">
                {job.congTyTen}
              </Link>
            ) : (
              <span>{job.congTyTen}</span>
            )}
          </div>
          <p className="text-xs text-slate-500">{job.diaDiem}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded bg-slate-100 px-2 py-1">{job.mucLuong}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.capDo}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{job.hinhThuc}</span>
            {!isFeatured ? <span className="rounded bg-slate-100 px-2 py-1">{job.nganhNghe}</span> : null}
            <span className="rounded bg-slate-100 px-2 py-1">Hạn nộp: {job.hanNop}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {onAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onAction(job)}
              disabled={actionLoading}
              className="inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-semibold text-slate-800 disabled:text-slate-400"
            >
              <Heart className="h-4 w-4 fill-slate-900" />
              {actionLabel ?? "Bỏ lưu"}
            </Button>
          ) : null}

          <Link
            href={`/jobs/${job.id}`}
            className={
              isFeatured
                ? "inline-flex h-10 items-center justify-center rounded-md bg-[#008080] px-4 text-sm font-semibold text-white hover:bg-[#006d6d]"
                : "inline-flex h-10 items-center justify-center rounded-md bg-[#008080] px-4 text-sm font-semibold text-white hover:bg-[#006d6d]"
            }
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
