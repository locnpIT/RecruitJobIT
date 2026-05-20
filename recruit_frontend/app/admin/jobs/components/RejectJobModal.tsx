import type { AdminJob } from "@/services/admin/types";
import { Button } from "@/components/ui/Button";

type RejectJobModalProps = {
  rejectingJob: AdminJob | null;
  rejectReason: string;
  submitting: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

// Modal nhập lý do từ chối tin tuyển dụng.
export function RejectJobModal({ rejectingJob, rejectReason, submitting, onReasonChange, onCancel, onConfirm }: RejectJobModalProps) {
  if (!rejectingJob) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Từ chối tin tuyển dụng</h3>
        <p className="mt-2 text-sm text-slate-600">Nhập lý do từ chối cho tin &quot;{rejectingJob.tieuDe ?? ""}&quot;.</p>
        <textarea
          rows={4}
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ví dụ: Nội dung chưa rõ ràng, thiếu quyền lợi..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="unstyled"
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Huỷ
          </Button>
          <Button variant="unstyled"
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </div>
      </div>
    </div>
  );
}
