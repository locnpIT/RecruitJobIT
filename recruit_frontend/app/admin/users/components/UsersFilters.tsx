import { Button } from "@/components/ui/Button";

type UsersFiltersProps = {
  keyword: string;
  role: string;
  status: string;
  roleOptions: string[];
  statusOptions: string[];
  onKeywordChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApply: () => void;
};

// Bộ lọc tìm kiếm user theo keyword, role và status.
export function UsersFilters({
  keyword,
  role,
  status,
  roleOptions,
  statusOptions,
  onKeywordChange,
  onRoleChange,
  onStatusChange,
  onApply,
}: UsersFiltersProps) {
  return (
    <div className="mb-4 grid gap-2 md:grid-cols-[1fr_170px_170px_auto]">
      <input
        type="text"
        placeholder="Tìm theo tên, email, số điện thoại..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-200 focus:ring"
      />
      <select value={role} onChange={(e) => onRoleChange(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
        {roleOptions.map((option) => (
          <option key={option || "all-role"} value={option}>
            {option ? option : "Tất cả vai trò"}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
        {statusOptions.map((option) => (
          <option key={option || "all-status"} value={option}>
            {option ? option : "Tất cả trạng thái"}
          </option>
        ))}
      </select>
      <Button variant="unstyled"
        type="button"
        onClick={onApply}
        className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Áp dụng
      </Button>
    </div>
  );
}
