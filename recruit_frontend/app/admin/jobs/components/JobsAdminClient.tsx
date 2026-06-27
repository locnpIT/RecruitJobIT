"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { JobDetailModal } from "./JobDetailModal";
import { JobsFilters } from "./JobsFilters";
import { JobsTable } from "./JobsTable";
import { useAdminJobsActions } from "../hooks/useAdminJobsActions";
import { useAdminJobsData } from "../hooks/useAdminJobsData";
import { Button } from "@/components/ui/Button";

export function JobsAdminClient() {
  const data = useAdminJobsData();
  const actions = useAdminJobsActions({ onReload: data.loadJobs });
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);

  const approvableJobs = useMemo(
    () => data.jobs.filter((job) => job.trangThai !== "APPROVED" && job.trangThai !== "DELETED"),
    [data.jobs],
  );

  const selectedJobs = useMemo(
    () => approvableJobs.filter((job) => selectedJobIds.includes(job.id)),
    [approvableJobs, selectedJobIds],
  );

  const handleToggleJob = (jobId: number, checked: boolean) => {
    setSelectedJobIds((current) =>
      checked ? Array.from(new Set([...current, jobId])) : current.filter((id) => id !== jobId),
    );
  };

  const handleToggleAllJobs = (checked: boolean) => {
    setSelectedJobIds(checked ? approvableJobs.map((job) => job.id) : []);
  };

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

        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm text-slate-600">Đã chọn {selectedJobs.length} tin có thể duyệt.</p>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={actions.submitting || selectedJobs.length === 0}
            onClick={() => void actions.handleBulkApprove(selectedJobs.map((job) => job.id)).then((success) => {
              if (success) setSelectedJobIds([]);
            })}
          >
            {actions.submitting ? "Đang xử lý..." : "Duyệt đã chọn"}
          </Button>
        </div>

        <JobsTable
          jobs={data.jobs}
          loading={data.loading}
          error={data.error}
          formatSalary={actions.formatSalary}
          selectedJobIds={selectedJobs.map((job) => job.id)}
          allSelectableChecked={approvableJobs.length > 0 && selectedJobs.length === approvableJobs.length}
          hasSelectableJobs={approvableJobs.length > 0}
          submitting={actions.submitting}
          onToggleJob={handleToggleJob}
          onToggleAllJobs={handleToggleAllJobs}
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
