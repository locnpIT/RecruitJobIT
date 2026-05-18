import { StateCard } from "@/app/components/shared/StateCard";

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
    return <StateCard message="Đang tải danh sách việc làm..." paddingClassName="p-5" />;
  }

  if (error) {
    return <StateCard message={error} tone="error" paddingClassName="p-5" />;
  }

  if (empty) {
    return (
      <StateCard
        message="Không tìm thấy tin tuyển dụng phù hợp với bộ lọc hiện tại."
        paddingClassName="p-6"
        className="text-slate-600"
      />
    );
  }

  return null;
}
