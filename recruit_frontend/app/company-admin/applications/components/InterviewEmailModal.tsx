import { useEffect, useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type InterviewEmailModalProps = {
  open: boolean;
  applicationId: number | null;
  applicationName: string | null;
  applicationEmail: string | null;
  branchName: string | null;
  sending: boolean;
  onClose: () => void;
  onSend: (payload: { thoiGianPhongVan: string; diaDiemPhongVan: string; ghiChu?: string }) => Promise<void> | void;
};

// Modal riêng để soạn mail mời phỏng vấn.
// Giữ modal hồ sơ sạch, chỉ mở form khi HR thật sự muốn gửi mail.
export function InterviewEmailModal({
  open,
  applicationId,
  applicationName,
  applicationEmail,
  branchName,
  sending,
  onClose,
  onSend,
}: InterviewEmailModalProps) {
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNote, setInterviewNote] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setInterviewDateTime("");
    setInterviewLocation(branchName?.trim() ?? "");
    setInterviewNote("");
  }, [branchName, open]);

  if (!open) {
    return null;
  }

  const canSend = Boolean(applicationId) && Boolean(interviewDateTime) && Boolean(interviewLocation.trim()) && !sending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <section className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gửi email phỏng vấn</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{applicationName ?? "Ứng viên"}</h2>
            <p className="mt-1 text-sm text-slate-600">{applicationEmail ?? "--"}</p>
          </div>
          <Button
            variant="unstyled"
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Đóng modal gửi email phỏng vấn"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="space-y-4 px-5 py-5">
    
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Thời gian phỏng vấn</span>
            <input
              type="datetime-local"
              value={interviewDateTime}
              onChange={(event) => setInterviewDateTime(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Địa điểm phỏng vấn</span>
            <input
              type="text"
              value={interviewLocation}
              onChange={(event) => setInterviewLocation(event.target.value)}
              placeholder="Phòng họp, tên chi nhánh, địa chỉ, link online..."
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-500">
              Tự điền tên chi nhánh đang chọn, HR có thể sửa lại nếu cần.
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Ghi chú</span>
            <textarea
              value={interviewNote}
              onChange={(event) => setInterviewNote(event.target.value)}
              rows={3}
              placeholder="Dặn ứng viên mang theo gì, liên hệ ai..."
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="unstyled"
              type="button"
              disabled={!canSend}
              onClick={() => {
                const confirmed = window.confirm(
                  `Bạn có muốn gửi email mời phỏng vấn tới ${applicationEmail ?? "ứng viên này"} không?`
                );
                if (!confirmed) {
                  return;
                }

                void Promise.resolve(
                  onSend({
                    thoiGianPhongVan: interviewDateTime,
                    diaDiemPhongVan: interviewLocation.trim(),
                    ghiChu: interviewNote.trim() || undefined,
                  })
                ).then(() => {
                  onClose();
                });
              }}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi mail...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Gửi email phỏng vấn
                </>
              )}
            </Button>
            <span className="text-xs text-slate-500">
              Mail sẽ được gửi tới {applicationEmail ?? "--"}.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
