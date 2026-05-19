"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { AdminCompany, AdminCompanyDetail } from "@/services/admin/types";

type UseAdminCompaniesActionsOptions = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/companies: xem detail + approve/reject company.
export function useAdminCompaniesActions({ onReload }: UseAdminCompaniesActionsOptions) {
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [rejectingCompany, setRejectingCompany] = useState<AdminCompany | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (company: AdminCompany) => {
    const confirmed = window.confirm(`Duyệt công ty ${company.ten}?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    try {
      await adminCompaniesService.approveCompany(company.id);
      toast.success("Đã duyệt công ty.");
      await onReload();
    } catch {
      toast.error("Không thể duyệt công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleViewDetail = async (company: AdminCompany) => {
    setIsDetailLoading(true);
    try {
      const detail = await adminCompaniesService.getCompanyDetail(company.id);
      setSelectedCompany(detail);
    } catch {
      toast.error("Không thể tải chi tiết công ty.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingCompany || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    setIsMutating(true);
    try {
      await adminCompaniesService.rejectCompany(rejectingCompany.id, {
        lyDoTuChoi: rejectReason.trim(),
      });
      toast.success("Đã từ chối công ty.");
      setRejectingCompany(null);
      setRejectReason("");
      await onReload();
    } catch {
      toast.error("Không thể từ chối công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  return {
    selectedCompany,
    isDetailLoading,
    isMutating,
    rejectingCompany,
    rejectReason,
    setSelectedCompany,
    setRejectingCompany,
    setRejectReason,
    handleApprove,
    handleViewDetail,
    handleReject,
  };
}
