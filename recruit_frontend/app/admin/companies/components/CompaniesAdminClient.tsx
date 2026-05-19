"use client";

import { PageHeader } from "../../components/PageHeader";
import { CompanyDetailModal } from "./CompanyDetailModal";
import { CompanyFilters } from "./CompanyFilters";
import { CompanyStatsCards } from "./CompanyStatsCards";
import { CompanyTable } from "./CompanyTable";
import { useAdminCompaniesActions } from "../hooks/useAdminCompaniesActions";
import { useAdminCompaniesData } from "../hooks/useAdminCompaniesData";

// Client container cho trang admin/companies.
export function CompaniesAdminClient() {
  const data = useAdminCompaniesData();
  const actions = useAdminCompaniesActions({ onReload: data.loadData });

  return (
    <>
      <PageHeader
        eyebrow="Doanh nghiệp"
        title="Duyệt Hồ Sơ Công Ty"
        subtitle="Xử lý luồng phê duyệt doanh nghiệp theo trạng thái và kiểm tra minh chứng pháp lý."
      />

      <CompanyStatsCards items={data.statsCards} />

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <CompanyFilters status={data.status} onStatusChange={data.setStatus} onReload={() => void data.loadData()} />
        <CompanyTable
          companies={data.companies}
          isLoading={data.isLoading}
          isMutating={actions.isMutating}
          isDetailLoading={actions.isDetailLoading}
          onViewDetail={(company) => void actions.handleViewDetail(company)}
          onApprove={(company) => void actions.handleApprove(company)}
          onReject={actions.setRejectingCompany}
        />
      </section>

      {actions.selectedCompany ? (
        <CompanyDetailModal
          company={actions.selectedCompany}
          isMutating={actions.isMutating}
          onClose={() => actions.setSelectedCompany(null)}
          onApprove={async () => {
            const selected = actions.selectedCompany;
            if (!selected) {
              return;
            }
            await actions.handleApprove(selected.congTy);
            actions.setSelectedCompany(null);
          }}
          onReject={async () => {
            const selected = actions.selectedCompany;
            if (!selected) {
              return;
            }
            actions.setRejectingCompany(selected.congTy);
            actions.setSelectedCompany(null);
          }}
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
              <button
                type="button"
                disabled={actions.isMutating}
                onClick={() => {
                  actions.setRejectingCompany(null);
                  actions.setRejectReason("");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actions.isMutating}
                onClick={() => void actions.handleReject()}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white"
              >
                {actions.isMutating ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
