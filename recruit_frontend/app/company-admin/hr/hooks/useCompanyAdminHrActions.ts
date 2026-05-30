"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { toast } from "sonner";
import { companyAdminService } from "@/services/company-admin/company-admin.service";
import type { CompanyAdminHrAccount } from "@/services/company-admin/types";
import type { HrFormState } from "../components/HrCreateForm";

const emptyForm: HrFormState = {
  email: "",
  ten: "",
  ho: "",
  soDienThoai: "",
  matKhau: "",
  xacNhanMatKhau: "",
};

type UseCompanyAdminHrActionsParams = {
  setHrs: Dispatch<SetStateAction<CompanyAdminHrAccount[]>>;
};

// Dùng cho màn company-admin/hr: quản lý state modal/form và các thao tác create/update/delete HR.
export function useCompanyAdminHrActions({ setHrs }: UseCompanyAdminHrActionsParams) {
  const [form, setForm] = useState<HrFormState>(emptyForm);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHrUserId, setEditingHrUserId] = useState<number | null>(null);

  const toggleBranch = (branchId: number | null) => {
    if (branchId == null) {
      return;
    }

    setSelectedBranchIds((current) =>
      current.includes(branchId) ? current.filter((id) => id !== branchId) : [...current, branchId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBranchIds.length) {
      toast.error("Chọn ít nhất một chi nhánh.");
      return;
    }

    if (!form.email || !form.ten || !form.ho) {
      toast.error("Vui lòng điền đầy đủ họ tên và email.");
      return;
    }

    if (editingHrUserId == null && (!form.matKhau || form.matKhau.length < 6)) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (editingHrUserId == null && form.matKhau !== form.xacNhanMatKhau) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingHrUserId != null) {
        const updated = await companyAdminService.updateHr(editingHrUserId, {
          email: form.email.trim(),
          ten: form.ten.trim(),
          ho: form.ho.trim(),
          soDienThoai: form.soDienThoai.trim() || undefined,
          dangHoatDong: true,
          chiNhanhIds: selectedBranchIds,
        });
        setHrs((current) => current.map((hr) => (hr.nguoiDungId === editingHrUserId ? updated : hr)));
      } else {
        const created = await companyAdminService.createHr({
          email: form.email.trim(),
          ten: form.ten.trim(),
          ho: form.ho.trim(),
          soDienThoai: form.soDienThoai.trim() || undefined,
          matKhau: form.matKhau,
          chiNhanhIds: selectedBranchIds,
        });
        setHrs((current) => [created, ...current]);
      }
      setForm(emptyForm);
      setSelectedBranchIds([]);
      setIsCreateModalOpen(false);
      setEditingHrUserId(null);
      toast.success(editingHrUserId == null ? "Đã tạo tài khoản HR thành công." : "Đã cập nhật tài khoản HR.");
    } catch {
      toast.error("Không thể tạo tài khoản HR.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingHrUserId(null);
    setForm(emptyForm);
    setSelectedBranchIds([]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (hr: CompanyAdminHrAccount) => {
    if (!hr.nguoiDungId) {
      return;
    }
    setEditingHrUserId(hr.nguoiDungId);
    setForm({
      email: hr.email ?? "",
      ten: hr.ten ?? "",
      ho: hr.ho ?? "",
      soDienThoai: hr.soDienThoai ?? "",
      matKhau: "",
      xacNhanMatKhau: "",
    });
    setSelectedBranchIds((hr.chiNhanhs ?? []).map((branch) => branch.chiNhanhId).filter((id): id is number => id != null));
    setIsCreateModalOpen(true);
  };

  const handleDeleteHr = async (hr: CompanyAdminHrAccount) => {
    if (!hr.nguoiDungId) {
      return;
    }
    const confirmed = window.confirm(`Xoá tài khoản HR ${hr.email ?? hr.ten ?? ""}?`);
    if (!confirmed) {
      return;
    }
    await companyAdminService.deleteHr(hr.nguoiDungId);
    setHrs((current) => current.filter((item) => item.nguoiDungId !== hr.nguoiDungId));
    toast.success("Đã xoá tài khoản HR.");
  };

  return {
    form,
    selectedBranchIds,
    isSaving,
    isCreateModalOpen,
    editingHrUserId,
    setForm,
    setIsCreateModalOpen,
    toggleBranch,
    handleSubmit,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleDeleteHr,
  };
}
