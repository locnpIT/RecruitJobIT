import { Button } from "@/components/ui/Button";

const statusOptions = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "DELETED", label: "Đã xoá" },
  { value: "", label: "Tất cả" },
];

type CompanyFiltersProps = {
  status: string;
  keyword: string;
  onStatusChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
};

export function CompanyFilters({ status, keyword, onStatusChange, onKeywordChange }: CompanyFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const active = status === option.value;
          return (
            <Button variant="unstyled"
              key={option.value || "all"}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                active ? "bg-[#008080] text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <input
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="Tìm theo tên công ty..."
        className="h-9 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-slate-500"
      />
    </div>
  );
}
