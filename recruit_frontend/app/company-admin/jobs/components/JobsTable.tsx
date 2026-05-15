import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { CompanyAdminJob } from "@/services/company-admin.service";

// Bảng danh sách job của công ty theo chi nhánh đang chọn.
// Component nhận callback edit/delete từ page container thay vì tự xử lý nghiệp vụ.
type JobsTableProps = {
  jobs: CompanyAdminJob[];
  isLoadingJobs: boolean;
  onEdit: (job: CompanyAdminJob) => void;
  onDelete: (job: CompanyAdminJob) => void;
};

export function JobsTable({ jobs, isLoadingJobs, onEdit, onDelete }: JobsTableProps) {
  if (isLoadingJobs) {
    return (
      <div className="flex items-center justify-center border border-slate-200 p-8 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải tin tuyển dụng...
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Chưa có tin tuyển dụng cho chi nhánh này.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th className="py-3 pl-4 font-normal">Tiêu đề</th>
            <th className="py-3 font-normal">Ngành</th>
            <th className="py-3 font-normal">Trạng thái</th>
            <th className="py-3 font-normal">Chi nhánh</th>
            <th className="py-3 font-normal">Kỹ năng</th>
            <th className="py-3 font-normal">Lương</th>
            <th className="py-3 font-normal">Số lượng</th>
            <th className="py-3 font-normal">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id ?? job.tieuDe} className="border-b border-slate-200">
              <td className="py-3 pl-4 font-medium text-slate-900">{job.tieuDe ?? "--"}</td>
              <td className="py-3 text-slate-600">{job.nganhNgheTen ?? "--"}</td>
              <td className="py-3 text-slate-600">{job.trangThai ?? "--"}</td>
              <td className="py-3 text-slate-600">{job.chiNhanhTen ?? "--"}</td>
              <td className="py-3 text-slate-600">
                {job.kyNangs?.length ? job.kyNangs.map((skill) => skill.ten).filter(Boolean).join(", ") : "--"}
              </td>
              <td className="py-3 text-slate-600">
                {job.luongToiThieu ?? "--"} - {job.luongToiDa ?? "--"}
              </td>
              <td className="py-3 text-slate-600">{job.soLuongTuyen?.toString() ?? "--"}</td>
              <td className="py-3">
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onEdit(job)}>
                    Cập nhật
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => onDelete(job)}>
                    Xoá
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
