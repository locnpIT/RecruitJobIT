"use client";

import type { FormEvent } from "react";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import type { PackageFormState } from "./package-types";

// Modal tạo/sửa gói dịch vụ.
// Được dùng lại cho cả create flow và update flow, khác nhau ở props `isEditing` và dữ liệu form.
type PackageFormModalProps = {
  open: boolean;
  title: string;
  subtitle: string;
  form: PackageFormState;
  isSubmitting: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (next: PackageFormState) => void;
  onReset: () => void;
};

export function PackageFormModal({
  open,
  title,
  subtitle,
  form,
  isSubmitting,
  isEditing,
  onClose,
  onSubmit,
  onChange,
  onReset,
}: PackageFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="w-full max-w-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Tên gói"
              value={form.tenGoi}
              onChange={(value) => onChange({ ...form, tenGoi: value })}
              placeholder="Gói 30 ngày"
            />
            <Field
              label="Số ngày hiệu lực"
              value={form.soNgayHieuLuc}
              onChange={(value) => onChange({ ...form, soNgayHieuLuc: value })}
              placeholder="30"
              type="number"
            />
          </div>

          <Field
            label="Giá niêm yết"
            value={form.giaNiemYet}
            onChange={(value) => onChange({ ...form, giaNiemYet: value })}
            placeholder="990000"
            type="number"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              rows={5}
              value={form.moTa}
              onChange={(event) => onChange({ ...form, moTa: event.target.value })}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Mô tả gói..."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={onReset}>
              Làm mới
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                "Cập nhật"
              ) : (
                "Tạo gói"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Field input dùng cục bộ trong modal để tránh lặp label + input boilerplate.
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
