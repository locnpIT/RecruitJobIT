"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  companyAdminService,
  type CompanyAdminBranch,
  type CompanyAdminHrAccount,
} from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { HrCreateForm, type HrFormState } from "./components/HrCreateForm";
import { HrListTable } from "./components/HrListTable";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";

// Màn quản lý HR của công ty.
// Điều phối form tạo/sửa HR, danh sách HR hiện có và quyền truy cập theo trạng thái duyệt công ty.
const emptyForm: HrFormState = {
  email: "",
  ten: "",
  ho: "",
  soDienThoai: "",
  matKhau: "",
  xacNhanMatKhau: "",
};

export default function CompanyAdminHrPage() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [hrs, setHrs] = useState<CompanyAdminHrAccount[]>([]);
  const [form, setForm] = useState<HrFormState>(emptyForm);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHrUserId, setEditingHrUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        setCompanyStatus(response.congTy.trangThai ?? null);

        if (!isCompanyApproved(response.congTy.trangThai)) {
          return;
        }

        return Promise.all([companyAdminService.getBranches(), companyAdminService.getHrs()])
          .then(([branchData, hrData]) => {
            if (!active) return;
            setBranches(branchData);
            setHrs(hrData);
          });
      })
      .catch(() => {
        if (!active) return;
        setError("Không tải được dữ liệu nhân sự.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleBranch = (branchId: number | null) => {
    if (branchId == null) {
      return;
    }

    setSelectedBranchIds((current) =>
      current.includes(branchId) ? current.filter((id) => id !== branchId) : [...current, branchId]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    if (!hr.nguoiDungId) return;
    setEditingHrUserId(hr.nguoiDungId);
    setForm({
      email: hr.email ?? "",
      ten: hr.ten ?? "",
      ho: hr.ho ?? "",
      soDienThoai: hr.soDienThoai ?? "",
      matKhau: "",
      xacNhanMatKhau: "",
    });
    setSelectedBranchIds(
      (hr.chiNhanhs ?? [])
        .map((branch) => branch.chiNhanhId)
        .filter((id): id is number => id != null)
    );
    setIsCreateModalOpen(true);
  };

  const handleDeleteHr = async (hr: CompanyAdminHrAccount) => {
    if (!hr.nguoiDungId) return;
    const confirmed = window.confirm(`Xoá tài khoản HR ${hr.email ?? hr.ten ?? ""}?`);
    if (!confirmed) return;
    await companyAdminService.deleteHr(hr.nguoiDungId);
    setHrs((current) => current.filter((item) => item.nguoiDungId !== hr.nguoiDungId));
    toast.success("Đã xoá tài khoản HR.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải nhân sự...
      </div>
    );
  }

  if (error) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (!isCompanyApproved(companyStatus)) {
    return (
      <div className="space-y-8 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Nhân sự</p>
          <h1 className="mt-2 text-2xl font-semibold">Tài khoản HR</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tạo một người dùng mới, gắn vai trò công ty HR, rồi phân quyền cho nhiều chi nhánh.
          </p>
        </header>
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <header className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Nhân sự</p>
        <h1 className="mt-2 text-2xl font-semibold">Tài khoản HR</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tạo một người dùng mới, gắn vai trò công ty HR, rồi phân quyền cho nhiều chi nhánh.
        </p>
      </header>

      <section className="space-y-5">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Tạo mới nhân sự</p>
              <p className="mt-1 text-sm text-slate-500">Bấm tạo mới để mở form nhập thông tin HR.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Tạo mới
            </button>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <HrListTable hrs={hrs} onEdit={handleOpenEditModal} onDelete={(hr) => void handleDeleteHr(hr)} />
        </div>
      </section>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{editingHrUserId == null ? "Tạo tài khoản HR" : "Cập nhật tài khoản HR"}</h3>
                <p className="mt-1 text-sm text-slate-500">Nhập thông tin và gán chi nhánh cho nhân sự.</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Đóng
              </button>
            </div>

            <HrCreateForm
              branches={branches}
              form={form}
              selectedBranchIds={selectedBranchIds}
              isSaving={isSaving}
              isEditMode={editingHrUserId != null}
              onFormChange={setForm}
              onToggleBranch={toggleBranch}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
