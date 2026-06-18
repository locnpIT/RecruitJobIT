"use client";

import { PageHeader } from "../../components/PageHeader";
import { JobDetailModal } from "./JobDetailModal";
import { JobsFilters } from "./JobsFilters";
import { JobsTable } from "./JobsTable";
import { useAdminJobsActions } from "../hooks/useAdminJobsActions";
import { useAdminJobsData } from "../hooks/useAdminJobsData";

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
          formatSalary={actions.formatSalary}
          onViewDetail={(jobId) => void actions.handleViewDetail(jobId)}
        />
      </section>

      <JobDetailModal
        open={actions.detailOpen}
        detail={actions.detail}
        submitting={actions.submitting}
        onClose={() => actions.setDetailOpen(false)}
        onApprove={(jobId) => void actions.handleApprove(jobId)}
        onReject={(jobId, reason) => void actions.handleReject(jobId, reason)}
        onHide={(jobId) => void actions.handleHide(jobId)}
      />
    </>
  );
}
