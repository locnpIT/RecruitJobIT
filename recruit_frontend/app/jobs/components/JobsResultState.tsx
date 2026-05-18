type JobsResultStateProps = {
  loading: boolean;
  error: string;
  empty: boolean;
};

/**
 * Render loading/error/empty state cho trang search jobs.
 */
export function JobsResultState({ loading, error, empty }: JobsResultStateProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Đang tải danh sách việc làm...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Không tìm thấy tin tuyển dụng phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return null;
}
