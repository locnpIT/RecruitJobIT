import { Button } from "@/components/ui/Button";

type JobsPaginationProps = {
  currentPage: number;
  hasNext: boolean;
  totalItems?: number;
  pageSize?: number;
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
};

/**
 * Pagination tối giản cho search jobs.
 */
export function JobsPagination({ currentPage, hasNext, totalItems, pageSize = 12, onPrev, onNext, disabled }: JobsPaginationProps) {
  const totalPages = typeof totalItems === "number" && totalItems > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : null;
  const startItem = typeof totalItems === "number" && totalItems > 0 ? currentPage * pageSize + 1 : null;
  const endItem =
    typeof totalItems === "number" && totalItems > 0 ? Math.min((currentPage + 1) * pageSize, totalItems) : null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {totalPages ? `Trang ${currentPage + 1} / ${totalPages}` : `Trang ${currentPage + 1}`}
        </p>
        {startItem != null && endItem != null && totalItems != null ? (
          <p className="mt-1 text-sm text-slate-600">
            Hiển thị {startItem}–{endItem} trong {totalItems} kết quả
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={disabled || currentPage <= 0}
          className="h-9 px-3 text-sm font-medium disabled:text-slate-400"
        >
          Trang trước
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={disabled || !hasNext}
          className="h-9 px-3 text-sm font-medium disabled:text-slate-400"
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
