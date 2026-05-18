import type { AdminJobDetail } from "@/services/admin.service";

type JobDetailModalProps = {
  open: boolean;
  detail: AdminJobDetail | null;
  onClose: () => void;
};

// Modal xem chi tiết nội dung tin tuyển dụng trước khi duyệt.
export function JobDetailModal({ open, detail, onClose }: JobDetailModalProps) {
  if (!open || !detail) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{detail.tongQuan.tieuDe ?? "Chi tiết tin"}</h3>
            <p className="mt-1 text-sm text-slate-500">{detail.tongQuan.congTyTen ?? "-"} • {detail.tongQuan.diaDiem ?? "-"}</p>
          </div>
          <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Mô tả</p>
            <p className="whitespace-pre-wrap">{detail.moTa || "-"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Yêu cầu</p>
            <p className="whitespace-pre-wrap">{detail.yeuCau || "-"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Phúc lợi</p>
            <p className="whitespace-pre-wrap">{detail.phucLoi || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
