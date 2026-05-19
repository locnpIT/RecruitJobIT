import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import type { AdminCandidateProof } from "@/services/admin/types";

type CandidateProofTableProps = {
  loading: boolean;
  items: AdminCandidateProof[];
  submittingId: string | null;
  proofTypeLabel: Record<string, string>;
  onApprove: (item: AdminCandidateProof) => void;
  onReject: (item: AdminCandidateProof) => void;
};

// Bảng duyệt/từ chối minh chứng ứng viên.
export function CandidateProofTable({
  loading,
  items,
  submittingId,
  proofTypeLabel,
  onApprove,
  onReject,
}: CandidateProofTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title="Không có minh chứng phù hợp" description="Thử đổi trạng thái hoặc tải lại dữ liệu." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 font-medium">Minh chứng</th>
            <th className="pb-2 font-medium">Loại</th>
            <th className="pb-2 font-medium">Ứng viên</th>
            <th className="pb-2 font-medium">Trạng thái</th>
            <th className="pb-2 font-medium">Tệp</th>
            <th className="pb-2 font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const rowKey = `${item.loai}-${item.id}`;
            const isSubmitting = submittingId === rowKey;
            return (
              <tr key={rowKey} className="border-b border-slate-100 last:border-none">
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-900">{item.tieuDe ?? "--"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.moTa ?? `Hồ sơ #${item.hoSoUngVienId ?? "--"}`}</p>
                </td>
                <td className="py-3 pr-4 text-slate-700">{proofTypeLabel[item.loai] ?? item.loai}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-900">{item.ungVienHoTen ?? "--"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.ungVienEmail ?? "--"}</p>
                </td>
                <td className="py-3 pr-4">
                  <StatusPill value={item.trangThai} />
                </td>
                <td className="py-3 pr-4">
                  {item.duongDanTep ? (
                    <a href={item.duongDanTep} target="_blank" rel="noreferrer" className="font-medium text-slate-700 underline">
                      Xem tệp
                    </a>
                  ) : (
                    <span className="text-slate-400">Không có tệp</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting || item.trangThai === "APPROVED"}
                      onClick={() => onApprove(item)}
                      className="rounded-md border border-emerald-300 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || item.trangThai === "REJECTED"}
                      onClick={() => onReject(item)}
                      className="rounded-md border border-rose-300 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
