"use client";

import { useState } from "react";
import { adminJobsService } from "@/services/admin/jobs.service";
import type { AdminJob, AdminJobDetail } from "@/services/admin/types";

type UseAdminJobsActionsOptions = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/jobs: detail + approve/reject/hide.
export function useAdminJobsActions({ onReload }: UseAdminJobsActionsOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<AdminJobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectingJob, setRejectingJob] = useState<AdminJob | null>(null);
  const [hidingJob, setHidingJob] = useState<AdminJob | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleViewDetail = async (jobId: number) => {
    try {
      const data = await adminJobsService.getJobDetail(jobId);
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
      await adminJobsService.approveJob(jobId);
      await onReload();
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
      await adminJobsService.rejectJob(rejectingJob.id, { lyDoTuChoi: rejectReason.trim() });
      setRejectingJob(null);
      setRejectReason("");
      await onReload();
    } catch (err) {
      console.error(err);
      alert("Từ chối tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async () => {
    if (!hidingJob) {
      return;
    }
    setSubmitting(true);
    try {
      await adminJobsService.hideJob(hidingJob.id);
      setHidingJob(null);
      await onReload();
    } catch (err) {
      console.error(err);
      alert("Ẩn tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (job: AdminJob) => {
    if (job.luongToiThieu == null && job.luongToiDa == null) {
      return "Thoả thuận";
    }
    const toVnd = (value: number | null) =>
      value == null
        ? ""
        : new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          }).format(value);

    if (job.luongToiThieu != null && job.luongToiDa != null) {
      return `${toVnd(job.luongToiThieu)} - ${toVnd(job.luongToiDa)}`;
    }
    return toVnd(job.luongToiThieu ?? job.luongToiDa);
  };

  return {
    submitting,
    detail,
    detailOpen,
    rejectingJob,
    hidingJob,
    rejectReason,
    setDetailOpen,
    setRejectingJob,
    setHidingJob,
    setRejectReason,
    handleViewDetail,
    handleApprove,
    handleReject,
    handleHide,
    formatSalary,
  };
}
