import Image from "next/image";
import Link from "next/link";
import { Bookmark, Building2, ExternalLink, Globe2, Loader2, MapPin, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PublicJobDetail } from "@/services/public/public-job.service";

type JobSidebarProps = {
  job: PublicJobDetail;
  isExpired: boolean;
  isFavorite: boolean;
  favoriteLoading: boolean;
  isApplied: boolean;
  applicationLoading: boolean;
  chatLoading: boolean;
  withdrawConfirming: boolean;
  withdrawLoading: boolean;
  withdrawError: string;
  onToggleFavorite: () => void;
  onApply: () => void;
  onOpenChat: () => void;
  onWithdrawRequest: () => void;
  onWithdrawConfirm: () => void;
  onWithdrawCancel: () => void;
};

// Sidebar của trang chi tiết job.
// Bao gồm card công ty, CTA ứng tuyển/lưu tin và danh sách việc làm tương tự.
// CTA ứng tuyển mở modal ở page cha để page kiểm soát auth, hồ sơ, upload CV và submit API.
export function JobSidebar({
  job,
  isExpired,
  isFavorite,
  favoriteLoading,
  isApplied,
  applicationLoading,
  chatLoading,
  withdrawConfirming,
  withdrawLoading,
  withdrawError,
  onToggleFavorite,
  onApply,
  onOpenChat,
  onWithdrawRequest,
  onWithdrawConfirm,
  onWithdrawCancel,
}: JobSidebarProps) {
  const companyLogoUrl = job.logoUrl;

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex gap-4">
          {companyLogoUrl ? (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              <Image
                src={companyLogoUrl}
                alt={`Logo ${job.congTy}`}
                width={64}
                height={64}
                className="h-16 w-16 object-contain p-1"
              />
            </div>
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg font-bold text-white">
              {job.congTy.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-950">{job.congTy}</h2>
              {job.congTyDaXacMinh ? <ShieldCheck className="h-4 w-4 text-slate-900" /> : null}
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {job.nganhNghe}
              </p>
              <p className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                {job.websiteCongTy}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.diaDiem}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">{job.moTaCongTy}</p>

        {job.congTyId ? (
          <Link
            href={`/companies/${job.congTyId}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
          >
            Xem thêm về công ty
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="primary"
            onClick={onApply}
            disabled={isExpired || isApplied || applicationLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold disabled:bg-slate-400"
          >
            <Send className="h-4 w-4" />
            {isExpired
              ? "Tin đã hết hạn"
              : isApplied
                ? "Đã ứng tuyển"
                : applicationLoading
                  ? "Đang kiểm tra..."
                  : "Ứng tuyển ngay"}
          </Button>

          {isApplied && !withdrawConfirming ? (
            <Button
              type="button"
              variant="unstyled"
              onClick={onWithdrawRequest}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-300 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Huỷ đơn ứng tuyển
            </Button>
          ) : null}

          {isApplied && withdrawConfirming ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-medium text-rose-800">Bạn chắc chắn muốn huỷ đơn?</p>
              <p className="mt-1 text-xs text-rose-600">Sau khi huỷ, bạn có thể ứng tuyển lại nếu tin vẫn còn hạn.</p>
              {withdrawError ? (
                <p className="mt-2 text-xs text-rose-700">{withdrawError}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={onWithdrawConfirm}
                  disabled={withdrawLoading}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {withdrawLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {withdrawLoading ? "Đang huỷ..." : "Xác nhận huỷ"}
                </Button>
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={onWithdrawCancel}
                  disabled={withdrawLoading}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Thoát
                </Button>
              </div>
            </div>
          ) : null}

          {isExpired ? (
            <p className="px-1 text-xs leading-5 text-rose-600">
              Tin này đã hết hạn nên không thể nộp hồ sơ mới.
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={onToggleFavorite}
            disabled={favoriteLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-800"
          >
            <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-slate-900" : ""}`} />
            {isFavorite ? "Đã lưu tin tuyển dụng" : "Lưu tin tuyển dụng"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenChat}
            disabled={chatLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-800 disabled:bg-slate-100"
          >
            <MessageCircle className="h-4 w-4" />
            {chatLoading ? "Đang mở chat..." : "Chat với nhà tuyển dụng"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Việc làm tương tự</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {job.viecLamTuongTu.map((item) => (
            <Link
              key={item.id}
              href={`/jobs/${item.id}`}
              className="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              {item.logoUrl ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                  <Image
                    src={item.logoUrl}
                    alt={`Logo ${item.congTyTen}`}
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain p-1"
                  />
                </div>
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  {item.congTyTen.slice(0, 2)}
                </div>
              )}
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
      
    </aside>
  );
}
