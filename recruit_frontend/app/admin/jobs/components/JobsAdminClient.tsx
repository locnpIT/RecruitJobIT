"use client";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PageHeader } from "../../components/PageHeader";
import { JobDetailModal } from "./JobDetailModal";
import { JobsFilters } from "./JobsFilters";
import { JobsTable } from "./JobsTable";
import { RejectJobModal } from "./RejectJobModal";
import { useAdminJobsActions } from "../hooks/useAdminJobsActions";
import { useAdminJobsData } from "../hooks/useAdminJobsData";

// Client container cho trang /admin/jobs.
export function JobsAdminClient() {
  const data = useAdminJobsData();
  const actions = useAdminJobsActions({ onReload: data.loadJobs });

  return (
    <>
      <PageHeader
        eyebrow="Tuyển dụng"
        title="Duyệt Tin Tuyển Dụng"
        subtitle="Rà soát nội dung tin và kiểm soát trạng thái hiển thị trước khi phát hành cho ứng viên."
      />

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <JobsFilters
          keyword={data.keyword}
          company={data.company}
          location={data.location}
          industry={data.industry}
          status={data.status}
          onKeywordChange={data.setKeyword}
          onCompanyChange={data.setCompany}
          onLocationChange={data.setLocation}
          onIndustryChange={data.setIndustry}
          onStatusChange={data.setStatus}
        />

        <JobsTable
          jobs={data.jobs}
          loading={data.loading}
          error={data.error}
          submitting={actions.submitting}
          formatSalary={actions.formatSalary}
          onViewDetail={(jobId) => void actions.handleViewDetail(jobId)}
          onApprove={(jobId) => void actions.handleApprove(jobId)}
          onReject={actions.setRejectingJob}
          onHide={actions.setHidingJob}
        />
      </section>

      <JobDetailModal open={actions.detailOpen} detail={actions.detail} onClose={() => actions.setDetailOpen(false)} />

      <RejectJobModal
        rejectingJob={actions.rejectingJob}
        rejectReason={actions.rejectReason}
        submitting={actions.submitting}
        onReasonChange={actions.setRejectReason}
        onCancel={() => {
          actions.setRejectingJob(null);
          actions.setRejectReason("");
        }}
        onConfirm={() => void actions.handleReject()}
      />

      <ConfirmDialog
        open={Boolean(actions.hidingJob)}
        title="Ẩn tin tuyển dụng"
        description={`Xác nhận ẩn tin "${actions.hidingJob?.tieuDe ?? ""}" khỏi danh sách hiển thị.`}
        tone="danger"
        confirmLabel="Xác nhận ẩn"
        isLoading={actions.submitting}
        onCancel={() => actions.setHidingJob(null)}
        onConfirm={() => void actions.handleHide()}
      />
    </>
  );
}
