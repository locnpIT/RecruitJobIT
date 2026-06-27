"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { CompanyDetailModal } from "./CompanyDetailModal";
import { CompanyFilters } from "./CompanyFilters";
import { CompanyFormModal } from "./CompanyFormModal";
import { CompanyStatsCards } from "./CompanyStatsCards";
import { CompanyTable } from "./CompanyTable";
import { useAdminCompaniesActions } from "../hooks/useAdminCompaniesActions";
import { useAdminCompaniesData } from "../hooks/useAdminCompaniesData";
import { Button } from "@/components/ui/Button";

// Client container cho trang admin/companies.
export function CompaniesAdminClient() {
  const data = useAdminCompaniesData();
  const actions = useAdminCompaniesActions({ onReload: data.loadData });
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);

  const approvableCompanies = useMemo(
    () => data.companies.filter((company) => company.trangThai !== "APPROVED" && company.trangThai !== "DELETED"),
    [data.companies],
  );

  const selectedCompanies = useMemo(
    () => approvableCompanies.filter((company) => selectedCompanyIds.includes(company.id)),
    [approvableCompanies, selectedCompanyIds],
  );

  const handleToggleCompany = (companyId: number, checked: boolean) => {
    setSelectedCompanyIds((current) =>
      checked ? Array.from(new Set([...current, companyId])) : current.filter((id) => id !== companyId),
    );
  };

  const handleToggleAllCompanies = (checked: boolean) => {
    setSelectedCompanyIds(checked ? approvableCompanies.map((company) => company.id) : []);
  };

  return (
    <>
      <PageHeader
        eyebrow="Doanh nghiệp"
        title="Quản lý Công ty"
        subtitle="Thêm, sửa, xoá công ty và xử lý luồng phê duyệt hồ sơ doanh nghiệp."
      />

      <CompanyStatsCards items={data.statsCards} />

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <CompanyFilters
            status={data.status}
            keyword={data.keyword}
            onStatusChange={data.setStatus}
            onKeywordChange={data.setKeyword}
          />
          <Button variant="primary" size="sm" type="button" onClick={actions.handleOpenCreate}>
            + Thêm công ty
          </Button>
        </div>
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm text-slate-600">Đã chọn {selectedCompanies.length} công ty có thể duyệt.</p>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={actions.isMutating || selectedCompanies.length === 0}
            onClick={() => void actions.handleBulkApprove(selectedCompanies).then((success) => {
              if (success) setSelectedCompanyIds([]);
            })}
          >
            {actions.isMutating ? "Đang xử lý..." : "Duyệt đã chọn"}
          </Button>
        </div>
        <CompanyTable
          companies={data.companies}
          status={data.status}
          isLoading={data.isLoading}
          isMutating={actions.isMutating}
          isDetailLoading={actions.isDetailLoading}
          selectedCompanyIds={selectedCompanies.map((company) => company.id)}
          allSelectableChecked={approvableCompanies.length > 0 && selectedCompanies.length === approvableCompanies.length}
          hasSelectableCompanies={approvableCompanies.length > 0}
          onToggleCompany={handleToggleCompany}
          onToggleAllCompanies={handleToggleAllCompanies}
          onViewDetail={(company) => void actions.handleViewDetail(company)}
          onApprove={(company) => void actions.handleApprove(company)}
          onReject={actions.setRejectingCompany}
          onEdit={actions.handleOpenEdit}
          onDelete={(company) => void actions.handleDelete(company)}
        />
      </section>

      {actions.selectedCompany ? (
        <CompanyDetailModal
          company={actions.selectedCompany}
          showReviewActions={data.status !== ""}
          isMutating={actions.isMutating}
          onClose={() => actions.setSelectedCompany(null)}
          onCreateBranch={(payload) => actions.handleCreateBranch(actions.selectedCompany!.congTy.id, payload)}
          onUpdateBranch={(branchId, payload) => actions.handleUpdateBranch(actions.selectedCompany!.congTy.id, branchId, payload)}
          onDeleteBranch={(branchId) => actions.handleDeleteBranch(actions.selectedCompany!.congTy.id, branchId)}
          onApprove={async () => {
            const selected = actions.selectedCompany;
            if (!selected) return;
            await actions.handleApprove(selected.congTy);
            actions.setSelectedCompany(null);
          }}
          onReject={async () => {
            const selected = actions.selectedCompany;
            if (!selected) return;
            actions.setRejectingCompany(selected.congTy);
            actions.setSelectedCompany(null);
          }}
        />
      ) : null}

      {actions.isFormOpen ? (
        <CompanyFormModal
          editingCompany={actions.editingCompany}
          submitting={actions.isMutating}
          onClose={actions.handleCloseForm}
          onSubmit={(form) => void actions.handleSubmitForm(form)}
        />
      ) : null}

      {actions.rejectingCompany ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Từ chối công ty</h3>
            <p className="mt-1 text-sm text-slate-600">Nhập lý do từ chối cho {actions.rejectingCompany.ten}.</p>
            <textarea
              value={actions.rejectReason}
              onChange={(e) => actions.setRejectReason(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Lý do từ chối..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="unstyled"
                type="button"
                disabled={actions.isMutating}
                onClick={() => {
                  actions.setRejectingCompany(null);
                  actions.setRejectReason("");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Hủy
              </Button>
              <Button variant="unstyled"
                type="button"
                disabled={actions.isMutating}
                onClick={() => void actions.handleReject()}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white"
              >
                {actions.isMutating ? "Đang xử lý..." : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
