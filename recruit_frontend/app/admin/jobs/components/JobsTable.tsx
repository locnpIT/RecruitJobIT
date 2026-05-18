import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import type { AdminJob } from "@/services/admin.service";

type JobsTableProps = {
  jobs: AdminJob[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  formatSalary: (job: AdminJob) => string;
  onViewDetail: (jobId: number) => void;
  onApprove: (jobId: number) => void;
  onReject: (job: AdminJob) => void;
  onHide: (job: AdminJob) => void;
};

// Bảng danh sách tin tuyển dụng cho admin duyệt tin.
export function JobsTable({
  jobs,
  loading,
  error,
  submitting,
  formatSalary,
  onViewDetail,
  onApprove,
  onReject,
  onHide,
}: JobsTableProps) {
  if (loading) {
    return <p className="py-6 text-sm text-slate-500">Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p className="py-6 text-sm text-rose-600">{error}</p>;
  }

  if (jobs.length === 0) {
    return <EmptyState title="Không có tin phù hợp" description="Điều chỉnh bộ lọc để tìm lại danh sách tin." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 font-medium">Tin tuyển dụng</th>
            <th className="pb-2 font-medium">Công ty</th>
            <th className="pb-2 font-medium">Địa điểm</th>
            <th className="pb-2 font-medium">Mức lương</th>
            <th className="pb-2 font-medium">Kinh nghiệm</th>
            <th className="pb-2 font-medium">Trạng thái</th>
            <th className="pb-2 font-medium">Ngày tạo</th>
            <th className="pb-2 font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-slate-100 last:border-none">
              <td className="py-2.5">
                <p className="font-medium text-slate-900">{job.tieuDe ?? "(Không có tiêu đề)"}</p>
                <p className="text-xs text-slate-500">#{job.id}</p>
              </td>
              <td className="py-2.5 text-slate-700">{job.congTyTen ?? "-"}</td>
              <td className="py-2.5 text-slate-700">{job.diaDiem ?? "-"}</td>
              <td className="py-2.5 text-slate-700">{formatSalary(job)}</td>
              <td className="py-2.5 text-slate-700">{job.capDoKinhNghiemTen ?? "-"}</td>
              <td className="py-2.5">
                <StatusPill value={job.trangThai} />
              </td>
              <td className="py-2.5 text-slate-500">{job.ngayTao ? new Date(job.ngayTao).toLocaleDateString("vi-VN") : "-"}</td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onViewDetail(job.id)} className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50">
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    disabled={submitting || job.trangThai === "APPROVED"}
                    onClick={() => onApprove(job.id)}
                    className="rounded-md border border-emerald-300 px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onReject(job)}
                    className="rounded-md border border-rose-300 px-2.5 py-1 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    disabled={submitting || job.trangThai === "HIDDEN"}
                    onClick={() => onHide(job)}
                    className="rounded-md border border-violet-300 px-2.5 py-1 text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ẩn tin
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
