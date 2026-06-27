import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import type { AdminJob } from "@/services/admin/types";
import { Button } from "@/components/ui/Button";

type JobsTableProps = {
  jobs: AdminJob[];
  loading: boolean;
  error: string | null;
  formatSalary: (job: AdminJob) => string;
  selectedJobIds: number[];
  allSelectableChecked: boolean;
  hasSelectableJobs: boolean;
  submitting: boolean;
  onToggleJob: (jobId: number, checked: boolean) => void;
  onToggleAllJobs: (checked: boolean) => void;
  onViewDetail: (jobId: number) => void;
};

export function JobsTable({
  jobs,
  loading,
  error,
  formatSalary,
  selectedJobIds,
  allSelectableChecked,
  hasSelectableJobs,
  submitting,
  onToggleJob,
  onToggleAllJobs,
  onViewDetail,
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
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-3 font-medium">
              <input
                type="checkbox"
                aria-label="Chọn tất cả tin có thể duyệt"
                checked={allSelectableChecked}
                disabled={!hasSelectableJobs || submitting}
                onChange={(event) => onToggleAllJobs(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
              />
            </th>
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
          {jobs.map((job) => {
            const canApprove = job.trangThai !== "APPROVED" && job.trangThai !== "DELETED";
            return (
            <tr key={job.id} className="border-b border-slate-100 last:border-none">
              <td className="py-2.5 pr-3">
                <input
                  type="checkbox"
                  aria-label={`Chọn tin ${job.tieuDe ?? job.id}`}
                  checked={selectedJobIds.includes(job.id)}
                  disabled={!canApprove || submitting}
                  onChange={(event) => onToggleJob(job.id, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
                />
              </td>
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
              <td className="py-2.5 text-slate-500">
                {job.ngayTao ? new Date(job.ngayTao).toLocaleDateString("vi-VN") : "-"}
              </td>
              <td className="py-2.5">
                <Button
                  variant="unstyled"
                  type="button"
                  onClick={() => onViewDetail(job.id)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Chi tiết
                </Button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
