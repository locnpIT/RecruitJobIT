import type { CompanyAdminApplication, CompanyAdminBranch } from "@/services/company-admin.service";

export type ApplicationFiltersValue = {
  status: string;
  jobId: string;
  fromDate: string;
  toDate: string;
};

type ApplicationFiltersProps = {
  branches: CompanyAdminBranch[];
  applications: CompanyAdminApplication[];
  selectedBranchId: number | null;
  filters: ApplicationFiltersValue;
  onBranchChange: (branchId: number) => void;
  onFiltersChange: (filters: ApplicationFiltersValue) => void;
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWING", label: "Đang xem xét" },
  { value: "ACCEPTED", label: "Đã chấp nhận" },
  { value: "REJECTED", label: "Đã từ chối" },
];

// Filter bar của màn đơn ứng tuyển.
// Filter chạy trên dữ liệu đã lấy theo chi nhánh để không phải tạo thêm API/query phức tạp.
export function ApplicationFilters({
  branches,
  applications,
  selectedBranchId,
  filters,
  onBranchChange,
  onFiltersChange,
}: ApplicationFiltersProps) {
  const jobOptions = Array.from(
    new Map(
      applications
        .filter((item) => item.tinTuyenDungId)
        .map((item) => [item.tinTuyenDungId, item.tieuDeTinTuyenDung ?? `Tin #${item.tinTuyenDungId}`])
    ).entries()
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Chi nhánh</span>
          <select
            value={selectedBranchId ?? ""}
            onChange={(event) => onBranchChange(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            {branches.map((branch) => (
              <option key={branch.chiNhanhId} value={branch.chiNhanhId ?? ""}>
                {branch.chiNhanhTen} {branch.vaiTroCongTy ? `(${branch.vaiTroCongTy})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Trạng thái</span>
          <select
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Tin tuyển dụng</span>
          <select
            value={filters.jobId}
            onChange={(event) => onFiltersChange({ ...filters, jobId: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="">Tất cả tin</option>
            {jobOptions.map(([jobId, title]) => (
              <option key={jobId} value={String(jobId)}>{title}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Từ ngày</span>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => onFiltersChange({ ...filters, fromDate: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Đến ngày</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => onFiltersChange({ ...filters, toDate: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
        </label>
      </div>
    </section>
  );
}
