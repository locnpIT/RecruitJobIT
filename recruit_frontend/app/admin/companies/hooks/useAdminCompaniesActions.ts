"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type {
  AdminCompany,
  AdminCompanyDetail,
  CreateAdminCompanyBranchPayload,
  CreateAdminCompanyPayload,
  UpdateAdminCompanyBranchPayload,
  UpdateAdminCompanyPayload,
} from "@/services/admin/types";

type UseAdminCompaniesActionsOptions = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/companies: xem detail + approve/reject/create/update/delete company.
export function useAdminCompaniesActions({ onReload }: UseAdminCompaniesActionsOptions) {
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [rejectingCompany, setRejectingCompany] = useState<AdminCompany | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleApprove = async (company: AdminCompany) => {
    const confirmed = window.confirm(`Duyệt công ty ${company.ten}?`);
    if (!confirmed) return;

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

  const handleBulkApprove = async (companies: AdminCompany[]) => {
    if (companies.length === 0) {
      toast.error("Vui lòng chọn ít nhất một công ty để duyệt.");
      return false;
    }

    const confirmed = window.confirm(`Duyệt ${companies.length} công ty đã chọn?`);
    if (!confirmed) return false;

    setIsMutating(true);
    try {
      await Promise.all(companies.map((company) => adminCompaniesService.approveCompany(company.id)));
      toast.success(`Đã duyệt ${companies.length} công ty.`);
      await onReload();
      return true;
    } catch {
      toast.error("Không thể duyệt hàng loạt công ty.");
      return false;
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

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (company: AdminCompany) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };

  const handleSubmitForm = async (form: { ten: string; maSoThue: string; website: string; moTa: string; chiNhanhs: CreateAdminCompanyBranchPayload[] }) => {
    setIsMutating(true);
    try {
      if (editingCompany) {
        const payload: UpdateAdminCompanyPayload = {
          ten: form.ten.trim(),
          website: form.website.trim() || undefined,
          moTa: form.moTa.trim() || undefined,
        };
        await adminCompaniesService.updateCompany(editingCompany.id, payload);
        toast.success("Đã cập nhật công ty.");
      } else {
        const payload: CreateAdminCompanyPayload = {
          ten: form.ten.trim(),
          maSoThue: form.maSoThue.trim(),
          website: form.website.trim() || undefined,
          moTa: form.moTa.trim() || undefined,
          chiNhanhs: form.chiNhanhs,
        };
        await adminCompaniesService.createCompany(payload);
        toast.success("Đã thêm công ty.");
      }
      setIsFormOpen(false);
      setEditingCompany(null);
      await onReload();
    } catch {
      toast.error(editingCompany ? "Không thể cập nhật công ty." : "Không thể thêm công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (company: AdminCompany) => {
    const confirmed = window.confirm(`Xoá công ty "${company.ten}"? Thao tác này không thể hoàn tác.`);
    if (!confirmed) return;

    setIsMutating(true);
    try {
      await adminCompaniesService.deleteCompany(company.id);
      toast.success("Đã xoá công ty.");
      await onReload();
    } catch {
      toast.error("Không thể xoá công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      return typeof error.response?.data?.message === "string" ? error.response.data.message : fallback;
    }
    return fallback;
  };

  const syncDetailAndList = async (detail: AdminCompanyDetail) => {
    setSelectedCompany(detail);
    await onReload();
  };

  const handleCreateBranch = async (companyId: number, payload: UpdateAdminCompanyBranchPayload) => {
    setIsMutating(true);
    try {
      const detail = await adminCompaniesService.createCompanyBranch(companyId, payload);
      await syncDetailAndList(detail);
      toast.success("Đã thêm chi nhánh.");
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, "Không thể thêm chi nhánh."));
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateBranch = async (companyId: number, branchId: number, payload: UpdateAdminCompanyBranchPayload) => {
    setIsMutating(true);
    try {
      const detail = await adminCompaniesService.updateCompanyBranch(companyId, branchId, payload);
      await syncDetailAndList(detail);
      toast.success("Đã cập nhật chi nhánh.");
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, "Không thể cập nhật chi nhánh."));
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteBranch = async (companyId: number, branchId: number) => {
    setIsMutating(true);
    try {
      const detail = await adminCompaniesService.deleteCompanyBranch(companyId, branchId);
      await syncDetailAndList(detail);
      toast.success("Đã xoá chi nhánh.");
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, "Không thể xoá chi nhánh."));
      return false;
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
    editingCompany,
    isFormOpen,
    setSelectedCompany,
    setRejectingCompany,
    setRejectReason,
    handleApprove,
    handleBulkApprove,
    handleViewDetail,
    handleReject,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleSubmitForm,
    handleDelete,
    handleCreateBranch,
    handleUpdateBranch,
    handleDeleteBranch,
  };
}
