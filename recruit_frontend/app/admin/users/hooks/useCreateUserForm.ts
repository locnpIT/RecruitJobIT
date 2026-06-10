"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { AdminCompany, AdminCompanyDetailBranch, CreateAdminUserPayload } from "@/services/admin/types";

type AccountType = CreateAdminUserPayload["loaiTaiKhoan"];

export type FormState = CreateAdminUserPayload & {
  chiNhanhIds: number[];
};

const initialForm: FormState = {
  ho: "",
  ten: "",
  email: "",
  soDienThoai: "",
  matKhau: "",
  loaiTaiKhoan: "CANDIDATE",
  dangHoatDong: true,
  tenCongTy: "",
  maSoThue: "",
  website: "",
  moTaCongTy: "",
  tenChiNhanh: "",
  diaChiChiTietChiNhanh: "",
  congTyId: undefined,
  chiNhanhIds: [],
};

export function cleanPayload(form: FormState): CreateAdminUserPayload {
  const basePayload: CreateAdminUserPayload = {
    ho: form.ho.trim(),
    ten: form.ten.trim(),
    email: form.email.trim(),
    soDienThoai: form.soDienThoai?.trim() || undefined,
    matKhau: form.matKhau.trim(),
    loaiTaiKhoan: form.loaiTaiKhoan,
    dangHoatDong: form.dangHoatDong,
  };

  if (form.loaiTaiKhoan === "COMPANY_ADMIN") {
    return {
      ...basePayload,
      congTyId: form.congTyId,
    };
  }

  if (form.loaiTaiKhoan === "HR") {
    return {
      ...basePayload,
      congTyId: form.congTyId,
      chiNhanhIds: form.chiNhanhIds,
    };
  }

  return basePayload;
}

// Quản lý form state, load danh sách công ty/chi nhánh động theo loại tài khoản.
export function useCreateUserForm(open: boolean) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [branches, setBranches] = useState<AdminCompanyDetailBranch[]>([]);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === form.congTyId) ?? null,
    [companies, form.congTyId],
  );

  // Reset form mỗi lần modal mở
  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setForm(initialForm);
      setMetadataError(null);
    });
    return () => { active = false; };
  }, [open]);

  // Load danh sách công ty khi type = HR hoặc COMPANY_ADMIN
  useEffect(() => {
    if (!open || (form.loaiTaiKhoan !== "HR" && form.loaiTaiKhoan !== "COMPANY_ADMIN")) return;
    let active = true;
    const loadCompanies = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const data = await adminCompaniesService.listCompanies();
        if (!active) return;
        setCompanies(data);
        setForm((prev) => ({ ...prev, congTyId: prev.congTyId ?? data[0]?.id }));
      } catch (error) {
        if (active) setMetadataError(getApiErrorMessage(error, "Không tải được danh sách công ty."));
      } finally {
        if (active) setMetadataLoading(false);
      }
    };
    void loadCompanies();
    return () => { active = false; };
  }, [open, form.loaiTaiKhoan]);

  // Load chi nhánh khi đã chọn công ty cho tài khoản HR
  useEffect(() => {
    if (!open || form.loaiTaiKhoan !== "HR" || !form.congTyId) {
      let active = true;
      Promise.resolve().then(() => { if (active) setBranches([]); });
      return () => { active = false; };
    }
    let active = true;
    const loadBranches = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const detail = await adminCompaniesService.getCompanyDetail(form.congTyId as number);
        if (!active) return;
        const activeBranches = detail.chiNhanhs.filter(
          (branch) => branch.id !== null && branch.trangThai !== "DELETED",
        );
        setBranches(activeBranches);
        setForm((prev) => ({
          ...prev,
          chiNhanhIds:
            prev.congTyId === form.congTyId
              ? prev.chiNhanhIds.filter((id) => activeBranches.some((b) => b.id === id))
              : [],
        }));
      } catch (error) {
        if (active) {
          setMetadataError(getApiErrorMessage(error, "Không tải được danh sách chi nhánh."));
          setBranches([]);
        }
      } finally {
        if (active) setMetadataLoading(false);
      }
    };
    void loadBranches();
    return () => { active = false; };
  }, [open, form.loaiTaiKhoan, form.congTyId]);

  const updateAccountType = (nextType: AccountType) => {
    setForm((prev) => ({
      ...prev,
      loaiTaiKhoan: nextType,
      congTyId: nextType === "HR" || nextType === "COMPANY_ADMIN" ? prev.congTyId : undefined,
      chiNhanhIds: nextType === "HR" ? prev.chiNhanhIds : [],
    }));
  };

  const toggleBranch = (branchId: number) => {
    setForm((prev) => ({
      ...prev,
      chiNhanhIds: prev.chiNhanhIds.includes(branchId)
        ? prev.chiNhanhIds.filter((id) => id !== branchId)
        : [...prev.chiNhanhIds, branchId],
    }));
  };

  return {
    form,
    setForm,
    companies,
    branches,
    selectedCompany,
    metadataError,
    metadataLoading,
    updateAccountType,
    toggleBranch,
  };
}
