import type { CandidateActionTarget } from "../../hooks/useCompanyAdminApplicationsActions";
import { ApplicationCandidateMatchesTable } from "./ApplicationCandidateMatchesTable";
import { ApplicationMatchingControls } from "./ApplicationMatchingControls";
import type { ApplicationCandidateMatch } from "./types";

type CandidateMatchingPanelProps = {
  jobRequiresCv: boolean;
  selectedJobTitle?: string | null;
  minimumScore: number;
  semanticLoading: boolean;
  semanticError: string;
  matches: ApplicationCandidateMatch[];
  selectedMatchKey?: string | null;
  openingChatTargetKey: string | null;
  jobSelectedByFilter: boolean;
  onMinimumScoreChange: (score: number) => void;
  onSelectMatch: (matchKey: string) => void;
  onOpenSemanticInsight?: () => void;
  onOpenChat: (target: CandidateActionTarget) => void;
  onOpenDetail: (target: CandidateActionTarget) => void;
};

// Tab AI theo tin: dùng để tìm ứng viên phù hợp; job yêu cầu CV không mở modal giải thích.
export function CandidateMatchingPanel({
  jobRequiresCv,
  selectedJobTitle,
  minimumScore,
  semanticLoading,
  semanticError,
  matches,
  selectedMatchKey,
  openingChatTargetKey,
  jobSelectedByFilter,
  onMinimumScoreChange,
  onSelectMatch,
  onOpenSemanticInsight,
  onOpenChat,
  onOpenDetail,
}: CandidateMatchingPanelProps) {
  return (
    <>
      {jobRequiresCv ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          AI theo tin dùng để tìm ứng viên phù hợp và nhắn họ chuẩn bị CV. Job này không hiển thị modal giải thích lý do match.
        </div>
      ) : null}

      <ApplicationMatchingControls
        selectedJobTitle={selectedJobTitle}
        minimumScore={minimumScore}
        onMinimumScoreChange={onMinimumScoreChange}
        jobSelectedByFilter={jobSelectedByFilter}
      />

      {semanticLoading ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Đang lấy kết quả semantic matching từ Qdrant...
        </div>
      ) : null}

      {semanticError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {semanticError}
        </div>
      ) : null}

      <ApplicationCandidateMatchesTable
        matches={matches}
        selectedMatchKey={selectedMatchKey}
        openingChatTargetKey={openingChatTargetKey}
        onSelectMatch={onSelectMatch}
        onOpenSemanticInsight={jobRequiresCv ? undefined : onOpenSemanticInsight}
        onOpenChat={onOpenChat}
        onOpenDetail={onOpenDetail}
      />
    </>
  );
}
