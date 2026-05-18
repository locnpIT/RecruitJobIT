"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { adminService, type AdminJob, type AdminJobDetail } from "@/services/admin.service";
import { JobDetailModal } from "./components/JobDetailModal";
import { JobsFilters } from "./components/JobsFilters";
import { JobsTable } from "./components/JobsTable";
import { RejectJobModal } from "./components/RejectJobModal";

// Màn /admin/jobs.
// Chịu trách nhiệm render danh sách duyệt tin tuyển dụng, filter, xem chi tiết và thao tác approve/reject/hide.
export default function JobsAdminPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<AdminJobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectingJob, setRejectingJob] = useState<AdminJob | null>(null);
  const [hidingJob, setHidingJob] = useState<AdminJob | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filters = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      company: company.trim() || undefined,
      status: status || undefined,
      industry: industry.trim() || undefined,
      location: location.trim() || undefined,
    }),
    [keyword, company, status, industry, location],
  );

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listJobs(filters);
      setJobs(data);
    } catch (err) {
      setError("Không tải được danh sách tin tuyển dụng.");
      setJobs([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const formatSalary = (job: AdminJob) => {
    if (job.luongToiThieu == null && job.luongToiDa == null) return "Thoả thuận";
    const toVnd = (value: number | null) =>
      value == null ? "" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
    if (job.luongToiThieu != null && job.luongToiDa != null) {
      return `${toVnd(job.luongToiThieu)} - ${toVnd(job.luongToiDa)}`;
    }
    return toVnd(job.luongToiThieu ?? job.luongToiDa);
  };

  const handleViewDetail = async (jobId: number) => {
    try {
      const data = await adminService.getJobDetail(jobId);
      setDetail(data);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không tải được chi tiết tin.");
    }
  };

  const handleApprove = async (jobId: number) => {
    setSubmitting(true);
    try {
      await adminService.approveJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Duyệt tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingJob || !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.rejectJob(rejectingJob.id, { lyDoTuChoi: rejectReason.trim() });
      setRejectingJob(null);
      setRejectReason("");
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Từ chối tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async () => {
    if (!hidingJob) return;
    setSubmitting(true);
    try {
      await adminService.hideJob(hidingJob.id);
      setHidingJob(null);
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Ẩn tin thất bại.");
    } finally {
      setSubmitting(false);
    }
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
          keyword={keyword}
          company={company}
          location={location}
          industry={industry}
          status={status}
          onKeywordChange={setKeyword}
          onCompanyChange={setCompany}
          onLocationChange={setLocation}
          onIndustryChange={setIndustry}
          onStatusChange={setStatus}
        />

        <JobsTable
          jobs={jobs}
          loading={loading}
          error={error}
          submitting={submitting}
          formatSalary={formatSalary}
          onViewDetail={(jobId) => void handleViewDetail(jobId)}
          onApprove={(jobId) => void handleApprove(jobId)}
          onReject={setRejectingJob}
          onHide={setHidingJob}
        />
      </section>

      <JobDetailModal open={detailOpen} detail={detail} onClose={() => setDetailOpen(false)} />

      <RejectJobModal
        rejectingJob={rejectingJob}
        rejectReason={rejectReason}
        submitting={submitting}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectingJob(null);
          setRejectReason("");
        }}
        onConfirm={() => void handleReject()}
      />

      <ConfirmDialog
        open={Boolean(hidingJob)}
        title="Ẩn tin tuyển dụng"
        description={`Xác nhận ẩn tin "${hidingJob?.tieuDe ?? ""}" khỏi danh sách hiển thị.`}
        tone="danger"
        confirmLabel="Xác nhận ẩn"
        isLoading={submitting}
        onCancel={() => setHidingJob(null)}
        onConfirm={() => void handleHide()}
      />
    </>
  );
}
