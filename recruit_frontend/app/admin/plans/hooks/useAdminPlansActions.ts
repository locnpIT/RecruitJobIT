"use client";

import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminPackagesService } from "@/services/admin/packages.service";
import type { AdminPackage } from "@/services/admin/types";
import type { PackageFormState } from "../components/package-types";

const emptyForm: PackageFormState = {
  tenGoi: "",
  moTa: "",
  giaNiemYet: "",
  soNgayHieuLuc: "",
};

type UseAdminPlansActionsParams = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/plans: create/update/delete package + state modal/form.
export function useAdminPlansActions({ onReload }: UseAdminPlansActionsParams) {
  const [form, setForm] = useState<PackageFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setActionError(null);
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: AdminPackage) => {
    setEditingId(pkg.id ?? null);
    setForm({
      tenGoi: pkg.tenGoi ?? "",
      moTa: pkg.moTa ?? "",
      giaNiemYet: pkg.giaNiemYet?.toString() ?? "",
      soNgayHieuLuc: pkg.soNgayHieuLuc?.toString() ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tenGoi = form.tenGoi.trim();
    const moTa = form.moTa.trim();
    const giaNiemYet = Number(form.giaNiemYet);
    const soNgayHieuLuc = Number(form.soNgayHieuLuc);

    if (!tenGoi) {
      setActionError("Vui lòng nhập tên gói.");
      return;
    }
    if (!Number.isFinite(giaNiemYet) || giaNiemYet < 0) {
      setActionError("Giá niêm yết không hợp lệ.");
      return;
    }
    if (!Number.isFinite(soNgayHieuLuc) || soNgayHieuLuc <= 0) {
      setActionError("Số ngày hiệu lực phải lớn hơn 0.");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (editingId) {
        await adminPackagesService.updatePackage(editingId, {
          tenGoi,
          moTa,
          giaNiemYet,
          soNgayHieuLuc,
        });
        setActionSuccess("Đã cập nhật gói.");
      } else {
        await adminPackagesService.createPackage({
          tenGoi,
          moTa,
          giaNiemYet,
          soNgayHieuLuc,
        });
        setActionSuccess("Đã tạo gói mới.");
      }

      setForm(emptyForm);
      setEditingId(null);
      setIsModalOpen(false);
      await onReload();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Không thể lưu gói."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pkg: AdminPackage) => {
    if (!pkg.id) {
      return;
    }
    const confirmed = window.confirm(`Xoá gói ${pkg.tenGoi ?? ""}?`);
    if (!confirmed) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await adminPackagesService.deletePackage(pkg.id);
      setActionSuccess("Đã xoá gói.");
      if (editingId === pkg.id) {
        setEditingId(null);
        setForm(emptyForm);
        setIsModalOpen(false);
      }
      await onReload();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Không thể xoá gói."));
    }
  };

  return {
    form,
    editingId,
    isModalOpen,
    isSaving,
    actionError,
    actionSuccess,
    setActionError,
    setActionSuccess,
    setForm,
    openCreateModal,
    openEditModal,
    closeModal,
    resetForm,
    handleSubmit,
    handleDelete,
  };
}
