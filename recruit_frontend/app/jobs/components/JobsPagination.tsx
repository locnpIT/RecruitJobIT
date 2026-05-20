import { Button } from "@/components/ui/Button";

type JobsPaginationProps = {
  currentPage: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
};

/**
 * Pagination tối giản cho search jobs.
 */
export function JobsPagination({ currentPage, hasNext, onPrev, onNext, disabled }: JobsPaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={disabled || currentPage <= 0}
        className="h-9 px-3 text-sm font-medium disabled:text-slate-400"
      >
        Trang trước
      </Button>
      <span className="px-2 text-sm text-slate-600">Trang {currentPage + 1}</span>
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
  );
}
