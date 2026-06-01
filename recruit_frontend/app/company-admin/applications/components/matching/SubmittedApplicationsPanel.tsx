import type { CompanyAdminApplication } from "@/services/company-admin/types";
import type { CandidateActionTarget } from "../../hooks/useCompanyAdminApplicationsActions";
import { ApplicationsTable } from "../ApplicationsTable";
import type { ApplicationCandidateMatch } from "./types";

type SubmittedApplicationsPanelProps = {
  activeFilterJobId?: string;
  jobRequiresCv: boolean;
  applications: CompanyAdminApplication[];
  loading: boolean;
  semanticMatches: ApplicationCandidateMatch[];
  selectedMatchKey?: string | null;
  semanticLoading: boolean;
  semanticError: string;
  openingChatApplicationId: number | null;
  onSelectSemanticMatch: (matchKey: string) => void;
  onOpenSemanticInsight: () => void;
  onOpenChat: (target: CandidateActionTarget | number | null) => void;
  onOpenDetail: (target: CandidateActionTarget | number | null) => void;
};

// Tab Danh sách đơn: job yêu cầu CV chỉ hiển thị đơn/CV, job thường có thể kèm điểm AI.
export function SubmittedApplicationsPanel({
  activeFilterJobId,
  jobRequiresCv,
  applications,
  loading,
  semanticMatches,
  selectedMatchKey,
  semanticLoading,
  semanticError,
  openingChatApplicationId,
  onSelectSemanticMatch,
  onOpenSemanticInsight,
  onOpenChat,
  onOpenDetail,
}: SubmittedApplicationsPanelProps) {
  return (
    <div className="space-y-3">
      <SubmittedApplicationsNotice
        activeFilterJobId={activeFilterJobId}
        jobRequiresCv={jobRequiresCv}
        semanticLoading={semanticLoading}
      />

      {!jobRequiresCv && semanticError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {semanticError}
        </div>
      ) : null}

      <ApplicationsTable
        applications={applications}
        loading={loading}
        semanticMatches={jobRequiresCv ? [] : semanticMatches}
        selectedMatchKey={jobRequiresCv ? undefined : selectedMatchKey}
        showSemanticScore={Boolean(activeFilterJobId) && !jobRequiresCv}
        showCvColumn={jobRequiresCv}
        openingChatApplicationId={openingChatApplicationId}
        onSelectSemanticMatch={jobRequiresCv ? undefined : onSelectSemanticMatch}
        onOpenSemanticInsight={jobRequiresCv ? undefined : onOpenSemanticInsight}
        onOpenChat={onOpenChat}
        onOpenDetail={onOpenDetail}
      />
    </div>
  );
}

function SubmittedApplicationsNotice({
  activeFilterJobId,
  jobRequiresCv,
  semanticLoading,
}: {
  activeFilterJobId?: string;
  jobRequiresCv: boolean;
  semanticLoading: boolean;
}) {
  if (jobRequiresCv) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Tin này bắt buộc CV nên danh sách đơn chỉ hiển thị dữ liệu ứng tuyển và file CV, không xếp hạng AI trên đơn.
      </div>
    );
  }

  if (!activeFilterJobId) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Chọn một tin tuyển dụng ở bộ lọc để bật AI Matching cho danh sách đơn đã nộp.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {semanticLoading
        ? "Đang xếp hạng semantic các đơn đã nộp cho tin đang chọn..."
        : "Danh sách đơn đang được sắp xếp theo điểm semantic matching của từng đơn với tin đang chọn."}
    </div>
  );
}
