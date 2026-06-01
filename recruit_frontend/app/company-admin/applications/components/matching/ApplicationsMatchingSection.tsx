"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import type { CandidateActionTarget } from "../../hooks/useCompanyAdminApplicationsActions";
import { useApplicationsMatchingPreview } from "../../hooks/useApplicationsMatchingPreview";
import { ApplicationMatchInsightPanel } from "./ApplicationMatchInsightPanel";
import { ApplicationMatchingModeTabs } from "./ApplicationMatchingModeTabs";
import { CandidateMatchingPanel } from "./CandidateMatchingPanel";
import { SubmittedApplicationsPanel } from "./SubmittedApplicationsPanel";

type ApplicationsMatchingSectionProps = {
  applications: CompanyAdminApplication[];
  filteredApplications: CompanyAdminApplication[];
  loading: boolean;
  activeFilterJobId?: string;
  activeFilterJobRequiresCv?: boolean;
  openingChatApplicationId: number | null;
  openingChatTargetKey: string | null;
  onOpenChat: (target: CandidateActionTarget | number | null) => void;
  onOpenDetail: (target: CandidateActionTarget | number | null) => void;
};

export function ApplicationsMatchingSection({
  applications,
  filteredApplications,
  loading,
  activeFilterJobId,
  activeFilterJobRequiresCv = false,
  openingChatApplicationId,
  openingChatTargetKey,
  onOpenChat,
  onOpenDetail,
}: ApplicationsMatchingSectionProps) {
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const matching = useApplicationsMatchingPreview(applications, activeFilterJobId, {
    disableApplicationMatches: activeFilterJobRequiresCv,
    initialMode: activeFilterJobRequiresCv ? "job-to-candidates" : undefined,
  });
  const activeMode = activeFilterJobRequiresCv ? "job-to-candidates" : matching.mode;
  const applicationMatchScoreById = new Map(
    matching.applicationMatches
      .filter((match) => match.applicationId != null)
      .map((match) => [match.applicationId, match.score])
  );
  const rankedApplications =
    activeFilterJobId && matching.applicationMatches.length
      ? [...filteredApplications].sort((left, right) => {
          const leftScore = left.id == null ? -1 : applicationMatchScoreById.get(left.id) ?? -1;
          const rightScore = right.id == null ? -1 : applicationMatchScoreById.get(right.id) ?? -1;
          return rightScore - leftScore;
        })
      : filteredApplications;

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-semibold text-slate-950">Workspace xử lý ứng viên</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Quản lý đơn ứng tuyển và dùng AI Matching để chủ động tìm ứng viên phù hợp theo tin tuyển dụng.
          </p>
        </div>
        <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
          Qdrant ready
        </span>
      </div>

      <ApplicationMatchingModeTabs value={matching.mode} onChange={matching.setMode} />

      {matching.mode === "applications" ? (
        <SubmittedApplicationsPanel
          activeFilterJobId={activeFilterJobId}
          jobRequiresCv={activeFilterJobRequiresCv}
          applications={rankedApplications}
          loading={loading}
          semanticMatches={matching.applicationMatches}
          selectedMatchKey={matching.selectedApplicationMatch?.matchKey}
          semanticLoading={matching.applicationSemanticLoading}
          semanticError={matching.applicationSemanticError}
          openingChatApplicationId={openingChatApplicationId}
          onSelectSemanticMatch={matching.selectApplicationMatch}
          onOpenSemanticInsight={() => setInsightModalOpen(true)}
          onOpenChat={onOpenChat}
          onOpenDetail={onOpenDetail}
        />
      ) : (
        <CandidateMatchingPanel
          jobRequiresCv={activeFilterJobRequiresCv}
          selectedJobTitle={matching.selectedJobTitle}
          minimumScore={matching.minimumScore}
          semanticLoading={matching.semanticLoading}
          semanticError={matching.semanticError}
          matches={matching.candidateMatches}
          selectedMatchKey={matching.selectedCandidateMatch?.matchKey}
          openingChatTargetKey={openingChatTargetKey}
          jobSelectedByFilter={Boolean(activeFilterJobId)}
          onMinimumScoreChange={matching.setMinimumScore}
          onSelectMatch={matching.selectCandidateMatch}
          onOpenSemanticInsight={() => setInsightModalOpen(true)}
          onOpenChat={onOpenChat}
          onOpenDetail={onOpenDetail}
        />
      )}

      {!activeFilterJobRequiresCv ? (
        <ApplicationMatchInsightPanel
          candidateMatch={activeMode === "applications" ? matching.selectedApplicationMatch : matching.selectedCandidateMatch}
          dataSourceLabel={
            activeMode === "applications"
              ? "Điểm matching được tính từ semantic search trên các đơn đã nộp cho tin tuyển dụng đang chọn."
              : "Điểm matching chỉ lấy từ Qdrant semantic search theo vector hồ sơ ứng viên và tin tuyển dụng."
          }
          open={insightModalOpen}
          onClose={() => setInsightModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
