"use client";

import { Loader2 } from "lucide-react";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { isCompanyApproved } from "../../company-admin-status";
import { HrCreateForm } from "./HrCreateForm";
import { HrListTable } from "./HrListTable";
import { useCompanyAdminHrActions } from "../hooks/useCompanyAdminHrActions";
import { useCompanyAdminHrData } from "../hooks/useCompanyAdminHrData";

// Client container cho trang /company-admin/hr.
export function CompanyAdminHrClient() {
  const data = useCompanyAdminHrData();
  const actions = useCompanyAdminHrActions({ setHrs: data.setHrs });

  if (data.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải nhân sự...
      </div>
    );
  }

  if (data.error) {
    return <div className="border border-rose-200 px-4 py-3 text-sm text-rose-700">{data.error}</div>;
  }

  if (!isCompanyApproved(data.companyStatus)) {
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
              onClick={actions.handleOpenCreateModal}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Tạo mới
            </button>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <HrListTable hrs={data.hrs} onEdit={actions.handleOpenEditModal} onDelete={(hr) => void actions.handleDeleteHr(hr)} />
        </div>
      </section>

      {actions.isCreateModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {actions.editingHrUserId == null ? "Tạo tài khoản HR" : "Cập nhật tài khoản HR"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Nhập thông tin và gán chi nhánh cho nhân sự.</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
                onClick={() => actions.setIsCreateModalOpen(false)}
              >
                Đóng
              </button>
            </div>

            <HrCreateForm
              branches={data.branches}
              form={actions.form}
              selectedBranchIds={actions.selectedBranchIds}
              isSaving={actions.isSaving}
              isEditMode={actions.editingHrUserId != null}
              onFormChange={actions.setForm}
              onToggleBranch={actions.toggleBranch}
              onSubmit={actions.handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
