"use client";

import { Loader2 } from "lucide-react";
import { isCompanyApproved } from "../../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { ApplicationFilters } from "./ApplicationFilters";
import { ApplicationsMatchingSection } from "./matching/ApplicationsMatchingSection";
import { ApplicationsPageHeader } from "./ApplicationsPageHeader";
import { useCompanyAdminApplicationsActions } from "../hooks/useCompanyAdminApplicationsActions";
import { useCompanyAdminApplicationsData } from "../hooks/useCompanyAdminApplicationsData";

// Client container cho trang company-admin/applications.
export function CompanyAdminApplicationsClient() {
  const data = useCompanyAdminApplicationsData();
  const actions = useCompanyAdminApplicationsActions({
    setApplications: data.setApplications,
    setError: data.setError,
  });

  if (data.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!isCompanyApproved(data.companyStatus)) {
    return (
      <div className="space-y-5 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ứng viên</p>
          <h1 className="mt-2 text-2xl font-semibold">Đơn ứng tuyển theo chi nhánh</h1>
        </header>
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-900">
      <ApplicationsPageHeader />

      <ApplicationFilters
        branches={data.branches}
        jobs={data.jobs}
        selectedBranchId={data.selectedBranchId}
        filters={data.filters}
        onBranchChange={data.setSelectedBranchId}
        onFiltersChange={data.setFilters}
      />

      <p className="text-xs text-slate-500">
        {data.selectedBranch
          ? `${data.selectedBranch.chiNhanhTen} - ${data.selectedBranch.congTyTen}`
          : "Chưa chọn chi nhánh"}
      </p>

      {data.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{data.error}</div>
      ) : null}

      <ApplicationsMatchingSection
        applications={data.applications}
        filteredApplications={data.filteredApplications}
        loading={data.isLoadingApplications}
        activeFilterJobId={data.filters.jobId}
        openingChatApplicationId={actions.openingChatApplicationId}
        openingChatTargetKey={actions.openingChatTargetKey}
        onOpenChat={actions.handleOpenChat}
        onOpenDetail={actions.handleOpenDetail}
      />

      <ApplicationDetailModal
        open={actions.detailOpen}
        application={actions.selectedApplication}
        loading={actions.isLoadingDetail}
        savingStatus={actions.isSavingStatus}
        openingChat={actions.openingChatTargetKey === resolveChatTargetKey(actions.selectedApplication)}
        onClose={() => actions.setDetailOpen(false)}
        onStatusChange={actions.handleStatusChange}
        onOpenChat={() =>
          actions.handleOpenChat({
            applicationId: actions.selectedApplication?.id ?? null,
            jobId: actions.selectedApplication?.tinTuyenDungId ?? null,
            profileId: actions.selectedApplication?.hoSoUngVienId ?? null,
          })
        }
      />
    </div>
  );
}

function resolveChatTargetKey(application: { id: number | null; tinTuyenDungId: number | null; hoSoUngVienId: number | null } | null) {
  if (!application) {
    return null;
  }
  if (application.id) {
    return `application-${application.id}`;
  }
  return `profile-${application.tinTuyenDungId ?? "unknown"}-${application.hoSoUngVienId ?? "unknown"}`;
}
