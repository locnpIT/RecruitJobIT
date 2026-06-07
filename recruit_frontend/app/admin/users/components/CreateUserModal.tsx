"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { AdminCompany, AdminCompanyDetailBranch, CreateAdminUserPayload } from "@/services/admin/types";

type AccountType = CreateAdminUserPayload["loaiTaiKhoan"];

type CreateUserModalProps = {
  open: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdminUserPayload) => void;
};

type FormState = CreateAdminUserPayload & {
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

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: "CANDIDATE", label: "Ứng viên" },
  { value: "ADMIN", label: "Admin hệ thống" },
  { value: "COMPANY_ADMIN", label: "Admin công ty" },
  { value: "HR", label: "HR công ty" },
];

export function CreateUserModal({ open, isLoading, onClose, onSubmit }: CreateUserModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [branches, setBranches] = useState<AdminCompanyDetailBranch[]>([]);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === form.congTyId) ?? null,
    [companies, form.congTyId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    Promise.resolve().then(() => {
      if (!active) {
        return;
      }
      setForm(initialForm);
      setMetadataError(null);
    });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || form.loaiTaiKhoan !== "HR") {
      return;
    }

    let active = true;
    const loadCompanies = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const data = await adminCompaniesService.listCompanies({ status: "APPROVED" });
        if (!active) {
          return;
        }
        setCompanies(data);
        setForm((prev) => ({
          ...prev,
          congTyId: prev.congTyId ?? data[0]?.id,
        }));
      } catch (error) {
        if (active) {
          setMetadataError(getApiErrorMessage(error, "Không tải được danh sách công ty."));
        }
      } finally {
        if (active) {
          setMetadataLoading(false);
        }
      }
    };

    void loadCompanies();
    return () => {
      active = false;
    };
  }, [open, form.loaiTaiKhoan]);

  useEffect(() => {
    if (!open || form.loaiTaiKhoan !== "HR" || !form.congTyId) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          setBranches([]);
        }
      });
      return () => {
        active = false;
      };
    }

    let active = true;
    const loadBranches = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const detail = await adminCompaniesService.getCompanyDetail(form.congTyId as number);
        if (!active) {
          return;
        }
        const activeBranches = detail.chiNhanhs.filter((branch) => branch.id !== null && branch.trangThai !== "DELETED");
        setBranches(activeBranches);
        setForm((prev) => ({
          ...prev,
          chiNhanhIds: prev.congTyId === form.congTyId ? prev.chiNhanhIds.filter((id) => activeBranches.some((branch) => branch.id === id)) : [],
        }));
      } catch (error) {
        if (active) {
          setMetadataError(getApiErrorMessage(error, "Không tải được danh sách chi nhánh."));
          setBranches([]);
        }
      } finally {
        if (active) {
          setMetadataLoading(false);
        }
      }
    };

    void loadBranches();
    return () => {
      active = false;
    };
  }, [open, form.loaiTaiKhoan, form.congTyId]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(cleanPayload(form));
  };

  const updateAccountType = (nextType: AccountType) => {
    setForm((prev) => ({
      ...prev,
      loaiTaiKhoan: nextType,
      congTyId: nextType === "HR" ? prev.congTyId : undefined,
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Người dùng</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Thêm người dùng</h2>
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading} aria-label="Đóng" className="h-9 w-9 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            <span>Loại tài khoản</span>
            <select
              value={form.loaiTaiKhoan}
              onChange={(event) => updateAccountType(event.target.value as AccountType)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-200 focus:ring"
            >
              {accountTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Họ" required maxLength={100} value={form.ho} onChange={(value) => setForm((prev) => ({ ...prev, ho: value }))} />
            <TextField label="Tên" required maxLength={100} value={form.ten} onChange={(value) => setForm((prev) => ({ ...prev, ten: value }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Email" required type="email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
            <TextField
              label="Số điện thoại"
              maxLength={20}
              value={form.soDienThoai}
              onChange={(value) => setForm((prev) => ({ ...prev, soDienThoai: value }))}
            />
          </div>

          <TextField
            label="Mật khẩu"
            required
            type="password"
            minLength={6}
            value={form.matKhau}
            onChange={(value) => setForm((prev) => ({ ...prev, matKhau: value }))}
          />

          {form.loaiTaiKhoan === "COMPANY_ADMIN" ? (
            <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Thông tin công ty</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextField label="Tên công ty" required maxLength={150} value={form.tenCongTy} onChange={(value) => setForm((prev) => ({ ...prev, tenCongTy: value }))} />
                <TextField label="Mã số thuế" required maxLength={50} value={form.maSoThue} onChange={(value) => setForm((prev) => ({ ...prev, maSoThue: value }))} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextField label="Website" maxLength={255} value={form.website} onChange={(value) => setForm((prev) => ({ ...prev, website: value }))} />
                <TextField label="Tên chi nhánh chính" required maxLength={150} value={form.tenChiNhanh} onChange={(value) => setForm((prev) => ({ ...prev, tenChiNhanh: value }))} />
              </div>
              <div className="mt-3">
                <TextField
                  label="Địa chỉ chi nhánh chính"
                  required
                  maxLength={255}
                  value={form.diaChiChiTietChiNhanh}
                  onChange={(value) => setForm((prev) => ({ ...prev, diaChiChiTietChiNhanh: value }))}
                />
              </div>
              <label className="mt-3 block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Mô tả công ty</span>
                <textarea
                  maxLength={5000}
                  value={form.moTaCongTy}
                  onChange={(event) => setForm((prev) => ({ ...prev, moTaCongTy: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring"
                />
              </label>
            </section>
          ) : null}

          {form.loaiTaiKhoan === "HR" ? (
            <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Gán công ty và chi nhánh</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Công ty</span>
                  <select
                    required
                    value={form.congTyId ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        congTyId: event.target.value ? Number(event.target.value) : undefined,
                        chiNhanhIds: [],
                      }))
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-200 focus:ring"
                  >
                    <option value="">Chọn công ty</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.ten}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{selectedCompany?.ten ?? "Chưa chọn công ty"}</p>
                  <p className="mt-1 text-xs">Chỉ hiển thị công ty đã được duyệt.</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm font-medium text-slate-700">Chi nhánh phụ trách</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {branches.map((branch) => {
                    const branchId = branch.id ?? 0;
                    return (
                      <label key={branchId} className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.chiNhanhIds.includes(branchId)}
                          onChange={() => toggleBranch(branchId)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
                        />
                        <span>
                          <span className="block font-medium text-slate-900">{branch.ten ?? "Chi nhánh"}</span>
                          <span className="block text-xs text-slate-500">{branch.diaChiChiTiet ?? "Địa chỉ đang cập nhật"}</span>
                        </span>
                      </label>
                    );
                  })}
                  {!metadataLoading && branches.length === 0 ? <p className="text-sm text-slate-500">Chưa có chi nhánh để chọn.</p> : null}
                </div>
              </div>

              {metadataError ? <p className="mt-3 text-sm text-rose-600">{metadataError}</p> : null}
            </section>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.dangHoatDong}
              onChange={(event) => setForm((prev) => ({ ...prev, dangHoatDong: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#008080] focus:ring-[#008080]"
            />
            Đang hoạt động
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Huỷ
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading || metadataLoading}>
              {isLoading ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  minLength?: number;
  onChange: (value: string) => void;
};

function TextField({ label, value, required, type = "text", maxLength, minLength, onChange }: TextFieldProps) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        maxLength={maxLength}
        minLength={minLength}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-200 focus:ring"
      />
    </label>
  );
}

function cleanPayload(form: FormState): CreateAdminUserPayload {
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
      tenCongTy: form.tenCongTy?.trim(),
      maSoThue: form.maSoThue?.trim(),
      website: form.website?.trim() || undefined,
      moTaCongTy: form.moTaCongTy?.trim() || undefined,
      tenChiNhanh: form.tenChiNhanh?.trim(),
      diaChiChiTietChiNhanh: form.diaChiChiTietChiNhanh?.trim(),
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
