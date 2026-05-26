"use client";

import { Sparkles } from "lucide-react";
import type { CompanyAdminApplication } from "@/services/company-admin/types";
import type { CandidateActionTarget } from "../../hooks/useCompanyAdminApplicationsActions";
import { ApplicationsTable } from "../ApplicationsTable";
import { useApplicationsMatchingPreview } from "../../hooks/useApplicationsMatchingPreview";
import { ApplicationCandidateMatchesTable } from "./ApplicationCandidateMatchesTable";
import { ApplicationMatchInsightPanel } from "./ApplicationMatchInsightPanel";
import { ApplicationMatchingControls } from "./ApplicationMatchingControls";
import { ApplicationMatchingModeTabs } from "./ApplicationMatchingModeTabs";

type ApplicationsMatchingSectionProps = {
  applications: CompanyAdminApplication[];
  filteredApplications: CompanyAdminApplication[];
  loading: boolean;
  activeFilterJobId?: string;
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
  openingChatApplicationId,
  openingChatTargetKey,
  onOpenChat,
  onOpenDetail,
}: ApplicationsMatchingSectionProps) {
  const matching = useApplicationsMatchingPreview(applications, activeFilterJobId);
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
        <div className="space-y-3">
          {activeFilterJobId ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {matching.applicationSemanticLoading
                ? "Đang xếp hạng semantic các đơn đã nộp cho tin đang chọn..."
                : "Danh sách đơn đang được sắp xếp theo điểm semantic matching của từng đơn với tin đang chọn."}
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Chọn một tin tuyển dụng ở bộ lọc để bật AI Matching cho danh sách đơn đã nộp.
            </div>
          )}

          {matching.applicationSemanticError ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {matching.applicationSemanticError}
            </div>
          ) : null}

          <div className={activeFilterJobId ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]" : ""}>
            <ApplicationsTable
              applications={rankedApplications}
              loading={loading}
              semanticMatches={matching.applicationMatches}
              selectedMatchKey={matching.selectedApplicationMatch?.matchKey}
              showSemanticScore={Boolean(activeFilterJobId)}
              openingChatApplicationId={openingChatApplicationId}
              onSelectSemanticMatch={matching.selectApplicationMatch}
              onOpenChat={onOpenChat}
              onOpenDetail={onOpenDetail}
            />

            {activeFilterJobId ? (
              <ApplicationMatchInsightPanel
                candidateMatch={matching.selectedApplicationMatch}
                dataSourceLabel="Điểm matching được tính từ semantic search trên các đơn đã nộp cho tin tuyển dụng đang chọn."
              />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <ApplicationMatchingControls
            selectedJobTitle={matching.selectedJobTitle}
            minimumScore={matching.minimumScore}
            onMinimumScoreChange={matching.setMinimumScore}
            jobSelectedByFilter={Boolean(activeFilterJobId)}
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
            <ApplicationCandidateMatchesTable
              matches={matching.candidateMatches}
              selectedMatchKey={matching.selectedCandidateMatch?.matchKey}
              openingChatTargetKey={openingChatTargetKey}
              onSelectMatch={matching.selectCandidateMatch}
              onOpenChat={onOpenChat}
              onOpenDetail={onOpenDetail}
            />

            <ApplicationMatchInsightPanel
              candidateMatch={matching.selectedCandidateMatch}
              dataSourceLabel="Điểm matching chỉ lấy từ Qdrant semantic search theo vector hồ sơ ứng viên và tin tuyển dụng."
            />
          </div>
        </>
      )}
    </section>
  );
}
