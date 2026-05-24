import type { ApplicationMatchingJobOption } from "./types";

const SCORE_FILTER_OPTIONS = [20, 30, 40, 50, 60, 70, 80, 90];

type ApplicationMatchingControlsProps = {
  jobs: ApplicationMatchingJobOption[];
  selectedJobId: number;
  minimumScore: number;
  onJobChange: (jobId: number) => void;
  onMinimumScoreChange: (score: number) => void;
  jobLockedByFilter?: boolean;
};

export function ApplicationMatchingControls({
  jobs,
  selectedJobId,
  minimumScore,
  onJobChange,
  onMinimumScoreChange,
  jobLockedByFilter = false,
}: ApplicationMatchingControlsProps) {
  const selectedJobTitle = jobs.find((job) => job.id === selectedJobId)?.title ?? "Tin tuyển dụng đang lọc";

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
      {jobLockedByFilter ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm">
          <span className="font-medium text-teal-900">Đang dùng tin từ bộ lọc trên</span>
          <p className="mt-1 truncate text-teal-700">{selectedJobTitle}</p>
        </div>
      ) : (
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Tin tuyển dụng để xếp hạng</span>
          <select
            value={selectedJobId || ""}
            onChange={(event) => onJobChange(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
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
