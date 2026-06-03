import { FileText, Loader2, Mail, MessageSquareText } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { ApplicationStatusBadge, InterviewInviteBadge } from "./ApplicationStatusBadge";
import { Button } from "@/components/ui/Button";

type ApplicationDetailSummaryProps = {
  application: CompanyAdminApplication;
  savingStatus: boolean;
  sendingInterviewEmail: boolean;
  openingChat: boolean;
  onStatusChange: (status: string) => void;
  onOpenInterviewEmail: () => void;
  onOpenChat: () => void;
};

const STATUS_ACTIONS = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWING", label: "Đang xem xét" },
  { value: "ACCEPTED", label: "Chấp nhận" },
  { value: "REJECTED", label: "Từ chối" },
];

// Khối thông tin tổng quan + hành động chính của đơn ứng tuyển.
export function ApplicationDetailSummary({
  application,
  savingStatus,
  sendingInterviewEmail,
  openingChat,
  onStatusChange,
  onOpenInterviewEmail,
  onOpenChat,
}: ApplicationDetailSummaryProps) {
  const hasApplication = application.id != null;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{hasApplication ? "Trạng thái đơn" : "Nguồn hồ sơ"}</p>
          <div className="mt-2">
            {hasApplication ? (
              <div className="flex flex-wrap gap-2">
                <ApplicationStatusBadge status={application.trangThai} />
                <InterviewInviteBadge sentAt={application.thoiGianGuiThuMoi} />
              </div>
            ) : (
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                Gợi ý AI theo tin
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="unstyled"
            type="button"
            onClick={onOpenChat}
            disabled={openingChat}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {openingChat ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang mở chat...
              </>
            ) : (
              <>
                <MessageSquareText className="h-4 w-4" />
                Gửi tin nhắn
              </>
            )}
          </Button>
          {application.cvUrl ? (
            <a
              href={application.cvUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Tải CV
            </a>
          ) : (
            <span className="text-sm text-slate-500">Không có CV đính kèm</span>
          )}
        </div>
      </div>

      {hasApplication ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {STATUS_ACTIONS.map((status) => (
            <Button
              variant="unstyled"
              key={status.value}
              type="button"
              disabled={savingStatus || application.trangThai?.toUpperCase() === status.value}
              onClick={() => onStatusChange(status.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {savingStatus ? "Đang lưu..." : status.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          Ứng viên này chưa có đơn ứng tuyển cho tin đang chọn, nên chưa có trạng thái pipeline để cập nhật.
        </p>
      )}

      {application.trangThai?.toUpperCase() === "ACCEPTED" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900">Gửi email mời phỏng vấn</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Bấm để mở modal soạn mail riêng cho ứng viên đã được chấp nhận.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="unstyled"
                  type="button"
                  disabled={sendingInterviewEmail || !application.ungVienEmail}
                  onClick={onOpenInterviewEmail}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <Mail className="h-4 w-4" />
                  Gửi email mời phỏng vấn
                </Button>
                <span className="text-xs text-slate-500">Mail sẽ được gửi tới {application.ungVienEmail ?? "--"}.</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
