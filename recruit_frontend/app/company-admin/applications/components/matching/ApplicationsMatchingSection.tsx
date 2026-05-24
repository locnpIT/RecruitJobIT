"use client";

import { Sparkles } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import { ApplicationsTable } from "../ApplicationsTable";
import { useApplicationsMatchingPreview } from "../../hooks/useApplicationsMatchingPreview";
import { ApplicationCandidateMatchesTable } from "./ApplicationCandidateMatchesTable";
import { ApplicationJobMatchesList } from "./ApplicationJobMatchesList";
import { ApplicationMatchInsightPanel } from "./ApplicationMatchInsightPanel";
import { ApplicationMatchingControls } from "./ApplicationMatchingControls";
import { ApplicationMatchingModeTabs } from "./ApplicationMatchingModeTabs";

type ApplicationsMatchingSectionProps = {
  applications: CompanyAdminApplication[];
  filteredApplications: CompanyAdminApplication[];
  loading: boolean;
  activeFilterJobId?: string;
  openingChatApplicationId: number | null;
  onOpenChat: (applicationId: number | null) => void;
  onOpenDetail: (applicationId: number | null) => void;
};

export function ApplicationsMatchingSection({
  applications,
  filteredApplications,
  loading,
  activeFilterJobId,
  openingChatApplicationId,
  onOpenChat,
  onOpenDetail,
}: ApplicationsMatchingSectionProps) {
  const matching = useApplicationsMatchingPreview(applications, activeFilterJobId);

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-semibold text-slate-950">Workspace xử lý ứng viên</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Quản lý đơn ứng tuyển và chuyển sang AI Matching khi cần ưu tiên ứng viên theo tin tuyển dụng hoặc gợi ý tin phù hợp với một ứng viên.
          </p>
        </div>
        <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
          Qdrant ready
        </span>
      </div>

      <ApplicationMatchingModeTabs value={matching.mode} onChange={matching.setMode} />

      {matching.mode === "applications" ? (
        <ApplicationsTable
          applications={filteredApplications}
          loading={loading}
          openingChatApplicationId={openingChatApplicationId}
          onOpenChat={onOpenChat}
          onOpenDetail={onOpenDetail}
        />
      ) : (
        <>
          <ApplicationMatchingControls
            mode={matching.mode}
            jobs={matching.jobs}
            candidates={matching.candidates}
            selectedJobId={matching.selectedJobId}
            selectedCandidateId={matching.selectedCandidateId}
            minimumScore={matching.minimumScore}
            onJobChange={matching.setSelectedJobId}
            onCandidateChange={matching.setSelectedCandidateId}
            onMinimumScoreChange={matching.setMinimumScore}
            jobLockedByFilter={Boolean(activeFilterJobId)}
          />

          {matching.semanticLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Đang lấy kết quả semantic matching từ Qdrant...
            </div>
          ) : null}

          {matching.semanticError ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {matching.semanticError}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            {matching.mode === "job-to-candidates" ? (
              <ApplicationCandidateMatchesTable
                matches={matching.candidateMatches}
                selectedMatchKey={matching.selectedCandidateMatch?.matchKey}
                openingChatApplicationId={openingChatApplicationId}
                onSelectMatch={matching.selectCandidateMatch}
                onOpenChat={onOpenChat}
                onOpenDetail={onOpenDetail}
              />
            ) : (
              <ApplicationJobMatchesList
                matches={matching.jobMatches}
                selectedApplicationId={matching.selectedJobMatch?.applicationId}
                onSelectApplication={matching.selectApplication}
                onOpenDetail={onOpenDetail}
              />
            )}

            <ApplicationMatchInsightPanel
              candidateMatch={matching.mode === "job-to-candidates" ? matching.selectedCandidateMatch : null}
              jobMatch={matching.mode === "candidate-to-jobs" ? matching.selectedJobMatch : null}
              dataSourceLabel={
                matching.mode === "job-to-candidates" && matching.usingSemanticMatches
                  ? "Điểm matching được lấy từ Qdrant semantic search theo vector hồ sơ ứng viên và tin tuyển dụng."
                  : "Điểm hiện tại là preview từ dữ liệu đơn ứng tuyển, dùng khi Qdrant chưa có kết quả phù hợp."
              }
            />
          </div>
        </>
      )}
    </section>
  );
}
