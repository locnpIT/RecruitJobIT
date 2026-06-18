"use client";

import { useState } from "react";
import { adminJobsService } from "@/services/admin/jobs.service";
import type { AdminJob, AdminJobDetail } from "@/services/admin/types";

type UseAdminJobsActionsOptions = {
  onReload: () => Promise<void>;
};

export function useAdminJobsActions({ onReload }: UseAdminJobsActionsOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<AdminJobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
      setDetailOpen(false);
      await onReload();
    } catch (err) {
      console.error(err);
      alert("Duyệt tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (jobId: number, reason: string) => {
    setSubmitting(true);
    try {
      await adminJobsService.rejectJob(jobId, { lyDoTuChoi: reason });
      setDetailOpen(false);
      await onReload();
    } catch (err) {
      console.error(err);
      alert("Từ chối tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async (jobId: number) => {
    setSubmitting(true);
    try {
      await adminJobsService.hideJob(jobId);
      setDetailOpen(false);
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
    setDetailOpen,
    handleViewDetail,
    handleApprove,
    handleReject,
    handleHide,
    formatSalary,
  };
}
