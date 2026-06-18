"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { RichTextContent } from "@/app/components/shared/RichTextContent";
import { Button } from "@/components/ui/Button";
import type { AdminJobDetail } from "@/services/admin/types";

type JobDetailModalProps = {
  open: boolean;
  detail: AdminJobDetail | null;
  submitting: boolean;
  onClose: () => void;
  onApprove: (jobId: number) => void;
  onReject: (jobId: number, reason: string) => void;
  onHide: (jobId: number) => void;
};

const BACKGROUND_IMAGE_URL = `/background-job-detail-${Math.floor(Math.random() * 5) + 1}.png`;

export function JobDetailModal({ open, detail, submitting, onClose, onApprove, onReject, onHide }: JobDetailModalProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmHide, setConfirmHide] = useState(false);

  if (!open || !detail) {
    return null;
  }

  const summary = detail.tongQuan;
  const jobId = summary.id;
  const status = summary.trangThai;
  const companyName = summary.congTyTen ?? "Công ty";
  const companyLogoUrl = summary.congTyLogoUrl ?? null;

  const handleClose = () => {
    setRejectOpen(false);
    setRejectReason("");
    setConfirmHide(false);
    onClose();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onReject(jobId, rejectReason.trim());
    setRejectOpen(false);
    setRejectReason("");
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/55 px-4 py-6">
      <div className="mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-slate-50 shadow-xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Chi tiết tin tuyển dụng</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">Xem nội dung trước khi duyệt</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <section className="relative overflow-hidden border-b border-slate-200 bg-white">
            <Image
              src={BACKGROUND_IMAGE_URL}
              alt="Background job detail"
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-white/65" />
            <div className="relative grid gap-8 px-5 py-8 lg:grid-cols-[1.12fr_0.88fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {status ?? "N/A"}
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-slate-950 md:text-5xl">
                  {summary.tieuDe ?? "Tin tuyển dụng"}
                </h1>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {companyName}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {summary.diaDiem ?? "--"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {summary.nganhNgheTen ?? "--"}
                  </span>
                </div>
              </div>

              <div className="hidden min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white/95 lg:grid lg:place-items-center">
                {companyLogoUrl ? (
                  <Image
                    src={companyLogoUrl}
                    alt={`Logo ${companyName}`}
                    width={288}
                    height={176}
                    className="h-44 w-72 object-contain p-6"
                  />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-2xl bg-slate-900 text-3xl font-bold text-white">
                    {companyName.slice(0, 1)}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <section className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-slate-950">Thông tin công việc</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoRow icon={CalendarClock} label="Hạn nộp" value={formatDate(summary.denHanLuc)} />
                  <InfoRow icon={Wallet} label="Mức lương" value={formatSalary(summary.luongToiThieu, summary.luongToiDa)} />
                  <InfoRow icon={ShieldCheck} label="Bắt buộc CV" value={detail.batBuocCV ? "Có" : "Không"} />
                  <InfoRow icon={BriefcaseBusiness} label="Kinh nghiệm" value={summary.capDoKinhNghiemTen ?? "--"} />
                  <InfoRow icon={UsersRound} label="Số lượng tuyển" value={summary.soLuongTuyen != null ? `${summary.soLuongTuyen} người` : "--"} />
                </div>
              </section>

              <TextSection title="Mô tả công việc" text={detail.moTa} />
              <TextSection title="Yêu cầu ứng viên" text={detail.yeuCau} />
              <TextSection title="Phúc lợi" text={detail.phucLoi} />
            </article>

            <aside className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-950">Tổng quan tin</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Công ty: {companyName}</p>
                  <p>Địa điểm: {summary.diaDiem ?? "--"}</p>
                  <p>Chi nhánh: {summary.chiNhanhTen ?? "--"}</p>
                  <p>Trạng thái: {status ?? "--"}</p>
                </div>
              </section>

              {detail.mauCvUrl ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-950">Mẫu CV</p>
                  <a
                    href={detail.mauCvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-slate-900 hover:underline"
                  >
                    Mở mẫu CV
                  </a>
                </section>
              ) : null}
            </aside>
          </section>
        </div>

        {/* Footer — action zone */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          {rejectOpen ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Nhập lý do từ chối</p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="Ví dụ: Nội dung chưa rõ ràng, thiếu thông tin quyền lợi..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting}
                  onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Huỷ
                </Button>
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting || !rejectReason.trim()}
                  onClick={handleConfirmReject}
                  className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                </Button>
              </div>
            </div>
          ) : confirmHide ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Xác nhận ẩn tin &ldquo;<span className="font-medium">{summary.tieuDe}</span>&rdquo; khỏi danh sách hiển thị?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmHide(false)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Huỷ
                </Button>
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting}
                  onClick={() => { onHide(jobId); setConfirmHide(false); }}
                  className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận ẩn"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                variant="unstyled"
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting || status === "APPROVED"}
                  onClick={() => onApprove(jobId)}
                  className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duyệt tin
                </Button>
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting}
                  onClick={() => setRejectOpen(true)}
                  className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Từ chối
                </Button>
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={submitting || status === "HIDDEN"}
                  onClick={() => setConfirmHide(true)}
                  className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ẩn tin
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TextSection({ title, text }: { title: string; text: string | null }) {
  return (
    <section className="border-b border-slate-200 py-7 last:border-b-0 last:pb-0">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <RichTextContent html={text} emptyText="-" />
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-slate-500" />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return "Thoả thuận";
  const fmt = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}
