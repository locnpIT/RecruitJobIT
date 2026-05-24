import type { ApplicationMatchingMode } from "./types";
import type { ApplicationMatchingCandidateOption, ApplicationMatchingJobOption } from "./types";

type ApplicationMatchingControlsProps = {
  mode: ApplicationMatchingMode;
  jobs: ApplicationMatchingJobOption[];
  candidates: ApplicationMatchingCandidateOption[];
  selectedJobId: number;
  selectedCandidateId: number;
  minimumScore: number;
  onJobChange: (jobId: number) => void;
  onCandidateChange: (candidateId: number) => void;
  onMinimumScoreChange: (score: number) => void;
  jobLockedByFilter?: boolean;
};

export function ApplicationMatchingControls({
  mode,
  jobs,
  candidates,
  selectedJobId,
  selectedCandidateId,
  minimumScore,
  onJobChange,
  onCandidateChange,
  onMinimumScoreChange,
  jobLockedByFilter = false,
}: ApplicationMatchingControlsProps) {
  const selectedJobTitle = jobs.find((job) => job.id === selectedJobId)?.title ?? "Tin tuyển dụng đang lọc";

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
      {mode === "job-to-candidates" ? (
        jobLockedByFilter ? (
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
        )
      ) : (
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Ứng viên để gợi ý tin</span>
          <select
            value={selectedCandidateId || ""}
            onChange={(event) => onCandidateChange(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} - {candidate.profileTitle}
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
          <option value={60}>Từ 60%</option>
          <option value={70}>Từ 70%</option>
          <option value={80}>Từ 80%</option>
          <option value={90}>Từ 90%</option>
        </select>
      </label>
    </div>
  );
}
