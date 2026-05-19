"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCatalogsService } from "@/services/admin/catalogs.service";
import type { CatalogFormState } from "../components/CatalogCrudSection";
import type { CatalogKey } from "./useAdminCatalogsData";

type BusyState = Record<CatalogKey, boolean>;
type DeletingState = Record<CatalogKey, number | null>;

const EMPTY_BUSY: BusyState = {
  systemRoles: false,
  companyRoles: false,
  proofTypes: false,
  certificateTypes: false,
};

const EMPTY_DELETING: DeletingState = {
  systemRoles: null,
  companyRoles: null,
  proofTypes: null,
  certificateTypes: null,
};

type UseAdminCatalogsActionsParams = {
  onReload: () => Promise<void>;
};

// Dùng cho màn admin/catalogs: thao tác create/update/delete từng nhóm danh mục.
export function useAdminCatalogsActions({ onReload }: UseAdminCatalogsActionsParams) {
  const [saving, setSaving] = useState<BusyState>(EMPTY_BUSY);
  const [deletingId, setDeletingId] = useState<DeletingState>(EMPTY_DELETING);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const onCreate = async (key: CatalogKey, payload: CatalogFormState) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setActionError(null);
    setActionSuccess(null);
    try {
      if (key === "systemRoles") await adminCatalogsService.createSystemRole(payload);
      if (key === "companyRoles") await adminCatalogsService.createCompanyRole(payload);
      if (key === "proofTypes") await adminCatalogsService.createProofType(payload);
      if (key === "certificateTypes") await adminCatalogsService.createCertificateType(payload);
      setActionSuccess("Đã thêm danh mục.");
      await onReload();
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể thêm danh mục.");
      setActionError(message);
      throw error;
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const onUpdate = async (key: CatalogKey, id: number, payload: CatalogFormState) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setActionError(null);
    setActionSuccess(null);
    try {
      if (key === "systemRoles") await adminCatalogsService.updateSystemRole(id, payload);
      if (key === "companyRoles") await adminCatalogsService.updateCompanyRole(id, payload);
      if (key === "proofTypes") await adminCatalogsService.updateProofType(id, payload);
      if (key === "certificateTypes") await adminCatalogsService.updateCertificateType(id, payload);
      setActionSuccess("Đã cập nhật danh mục.");
      await onReload();
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể cập nhật danh mục.");
      setActionError(message);
      throw error;
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const onDelete = async (key: CatalogKey, id: number) => {
    const confirmed = window.confirm("Xác nhận xoá danh mục này?");
    if (!confirmed) {
      return;
    }
    setDeletingId((prev) => ({ ...prev, [key]: id }));
    setActionError(null);
    setActionSuccess(null);
    try {
      if (key === "systemRoles") await adminCatalogsService.deleteSystemRole(id);
      if (key === "companyRoles") await adminCatalogsService.deleteCompanyRole(id);
      if (key === "proofTypes") await adminCatalogsService.deleteProofType(id);
      if (key === "certificateTypes") await adminCatalogsService.deleteCertificateType(id);
      setActionSuccess("Đã xoá danh mục.");
      await onReload();
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể xoá danh mục.");
      setActionError(message);
    } finally {
      setDeletingId((prev) => ({ ...prev, [key]: null }));
    }
  };

  return {
    saving,
    deletingId,
    actionError,
    actionSuccess,
    setActionError,
    setActionSuccess,
    onCreate,
    onUpdate,
    onDelete,
  };
}
