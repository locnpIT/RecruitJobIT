"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import type { CompanyAdminBranch } from "@/services/company-admin.service";

// Form tạo/cập nhật tài khoản HR.
// Component này chỉ lo nhập liệu và chọn chi nhánh; validate nghiệp vụ được xử lý ở container/page.
export type HrFormState = {
  email: string;
  ten: string;
  ho: string;
  soDienThoai: string;
  matKhau: string;
  xacNhanMatKhau: string;
};

type HrCreateFormProps = {
  branches: CompanyAdminBranch[];
  form: HrFormState;
  selectedBranchIds: number[];
  isSaving: boolean;
  isEditMode?: boolean;
  onFormChange: (next: HrFormState) => void;
  onToggleBranch: (branchId: number | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function HrCreateForm({
  branches,
  form,
  selectedBranchIds,
  isSaving,
  isEditMode = false,
  onFormChange,
  onToggleBranch,
  onSubmit,
}: HrCreateFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const selectedBranchNames = branches
    .filter((branch) => branch.chiNhanhId != null && selectedBranchIds.includes(branch.chiNhanhId))
    .map((branch) => branch.chiNhanhTen ?? `Chi nhánh ${branch.chiNhanhId}`);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Tạo mới
      </div>

      <Field label="Email">
        <input
          value={form.email}
          onChange={(event) => onFormChange({ ...form, email: event.target.value })}
          className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="hr@company.com"
        />
      </Field>

      <Field label="Họ">
        <input
          value={form.ho}
          onChange={(event) => onFormChange({ ...form, ho: event.target.value })}
          className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="Nguyễn Văn"
        />
      </Field>

      <Field label="Tên">
        <input
          value={form.ten}
          onChange={(event) => onFormChange({ ...form, ten: event.target.value })}
          className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="HR"
        />
      </Field>

      <Field label="Số điện thoại">
        <input
          value={form.soDienThoai}
          onChange={(event) => onFormChange({ ...form, soDienThoai: event.target.value })}
          className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="0900000000"
        />
      </Field>

      {!isEditMode ? (
        <>
          <Field label="Mật khẩu">
            <PasswordField
              value={form.matKhau}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={(value) => onFormChange({ ...form, matKhau: value })}
              placeholder="Nhập mật khẩu cho HR"
            />
          </Field>

          <Field label="Xác nhận mật khẩu">
            <PasswordField
              value={form.xacNhanMatKhau}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              onChange={(value) => onFormChange({ ...form, xacNhanMatKhau: value })}
              placeholder="Nhập lại mật khẩu"
            />
          </Field>
        </>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Chi nhánh</span>
          <span className="text-slate-500">{selectedBranchIds.length} đã chọn</span>
        </div>

        <div className="max-h-72 space-y-2 overflow-auto rounded-md border border-slate-200 px-3 py-3">
          {branches.map((branch) => {
            const branchId = branch.chiNhanhId;
            const checked = branchId != null && selectedBranchIds.includes(branchId);
            return (
              <label key={branchId ?? branch.chiNhanhTen} className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleBranch(branchId)}
                  className="mt-1 h-4 w-4 border-slate-300 text-slate-900"
                />
                <span className="leading-6 text-slate-700">
                  {branch.chiNhanhTen ?? "--"}
                  {branch.laTruSoChinh ? " (Trụ sở chính)" : ""}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedBranchNames.length > 0 ? (
        <div className="text-sm text-slate-500">
          Đang gán: {selectedBranchNames.join(", ")}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-800 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {isSaving ? "Đang lưu..." : isEditMode ? "Lưu cập nhật" : "Tạo HR"}
      </button>
    </form>
  );
}

// Wrapper label dùng cục bộ cho các field trong form HR.
function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

// Password field có nút hiện/ẩn để giảm lặp code cho 2 ô mật khẩu.
function PasswordField({
  value,
  visible,
  onToggle,
  onChange,
  placeholder,
}: {
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 px-3 py-2 pr-11 text-sm outline-none focus:border-slate-900"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-500 hover:text-slate-900"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
