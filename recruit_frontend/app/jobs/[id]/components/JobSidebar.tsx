import Link from "next/link";
import { Bookmark, Building2, ExternalLink, Globe2, MapPin, Send, ShieldCheck, Users } from "lucide-react";
import type { PublicJobDetail } from "@/services/public-job.service";

type JobSidebarProps = {
  job: PublicJobDetail;
  isFavorite: boolean;
  favoriteLoading: boolean;
  isApplied: boolean;
  applicationLoading: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
};

// Sidebar của trang chi tiết job.
// Bao gồm card công ty, CTA ứng tuyển/lưu tin và danh sách việc làm tương tự.
// CTA ứng tuyển mở modal ở page cha để page kiểm soát auth, hồ sơ, upload CV và submit API.
export function JobSidebar({
  job,
  isFavorite,
  favoriteLoading,
  isApplied,
  applicationLoading,
  onToggleFavorite,
  onApply,
}: JobSidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg font-bold text-white">
            {job.company.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-950">{job.company}</h2>
              {job.companyVerified ? <ShieldCheck className="h-4 w-4 text-slate-900" /> : null}
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {job.industry}
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {job.companySize}
              </p>
              <p className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                {job.website}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">{job.companyDescription}</p>

        <Link
          href="/auth/login"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
        >
          Xem thêm về công ty
          <ExternalLink className="h-4 w-4" />
        </Link>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onApply}
            disabled={isApplied || applicationLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Send className="h-4 w-4" />
            {isApplied ? "Đã ứng tuyển" : applicationLoading ? "Đang kiểm tra..." : "Ứng tuyển ngay"}
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favoriteLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-slate-900" : ""}`} />
            {isFavorite ? "Đã lưu tin tuyển dụng" : "Lưu tin tuyển dụng"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Việc làm tương tự</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {job.similarJobs.map((item) => (
            <Link
              key={item.id}
              href={`/jobs/${item.id}`}
              className="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                {item.congTyTen.slice(0, 2)}
              </div>
              <div>
                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.tieuDe}</p>
                <p className="mt-1 text-xs text-slate-500">{item.congTyTen}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.diaDiem} · {item.capDo}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-950">Tạo hồ sơ để ứng tuyển dễ hơn</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Hồ sơ đầy đủ giúp nhà tuyển dụng hiểu kinh nghiệm, kỹ năng và mục tiêu nghề nghiệp của bạn.
        </p>
        <Link
          href="/auth/register/candidate"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Tạo hồ sơ ngay
        </Link>
      </section>
    </aside>
  );
}
