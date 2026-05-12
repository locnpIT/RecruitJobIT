const statusOptions = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "SUSPENDED", label: "Bị khóa" },
  { value: "", label: "Tất cả" },
];

type CompanyFiltersProps = {
  status: string;
  onStatusChange: (value: string) => void;
  onReload: () => void;
};

export function CompanyFilters({ status, onStatusChange, onReload }: CompanyFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const active = status === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReload}
        className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Tải lại
      </button>
    </div>
  );
}
