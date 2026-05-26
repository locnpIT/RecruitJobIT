const SCORE_FILTER_OPTIONS = [20, 30, 40, 50, 60, 70, 80, 90];

type ApplicationMatchingControlsProps = {
  selectedJobTitle?: string | null;
  minimumScore: number;
  onMinimumScoreChange: (score: number) => void;
  jobSelectedByFilter?: boolean;
};

export function ApplicationMatchingControls({
  selectedJobTitle,
  minimumScore,
  onMinimumScoreChange,
  jobSelectedByFilter = false,
}: ApplicationMatchingControlsProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
      {jobSelectedByFilter ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm">
          <span className="font-medium text-teal-900">Đang dùng tin từ bộ lọc trên</span>
          <p className="mt-1 truncate text-teal-700">{selectedJobTitle}</p>
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Chọn một tin tuyển dụng ở bộ lọc trên để bật xếp hạng AI theo tin.
        </div>
      )}

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Điểm tối thiểu</span>
        <select
          value={minimumScore}
          onChange={(event) => onMinimumScoreChange(Number(event.target.value))}
          className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
          {SCORE_FILTER_OPTIONS.map((score) => (
            <option key={score} value={score}>
              Từ {score}%
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
