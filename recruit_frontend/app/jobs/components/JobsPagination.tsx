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
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled || currentPage <= 0}
        className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Trang trước
      </button>
      <span className="px-2 text-sm text-slate-600">Trang {currentPage + 1}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || !hasNext}
        className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Trang sau
      </button>
    </div>
  );
}
