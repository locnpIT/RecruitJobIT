"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import {
  adminService,
  type AdminCompany,
  type AdminCompanyDetail,
  type AdminStatsResponse,
} from "@/services/admin.service";
import { toast } from "sonner";
import { CompanyStatsCards } from "./components/CompanyStatsCards";
import { CompanyFilters } from "./components/CompanyFilters";
import { CompanyTable } from "./components/CompanyTable";
import { CompanyDetailModal } from "./components/CompanyDetailModal";

// Màn duyệt công ty của admin.
// File này điều phối filter trạng thái, tải chi tiết công ty và các action approve/reject.
export default function CompaniesAdminPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyDetail | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [rejectingCompany, setRejectingCompany] = useState<AdminCompany | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, companiesResponse] = await Promise.all([
        adminService.getStats(),
        adminService.listCompanies({ status: status || undefined }),
      ]);
      setStats(statsResponse);
      setCompanies(companiesResponse);
    } catch {
      toast.error("Không tải được dữ liệu công ty.");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const statsCards = useMemo(
    () => [
      { label: "Tổng công ty", value: stats?.tongCongTy ?? 0 },
      { label: "Chờ duyệt", value: stats?.congTyChoDuyet ?? 0 },
      { label: "Đã duyệt", value: stats?.congTyDaDuyet ?? 0 },
      { label: "Bị từ chối", value: stats?.congTyBiTuChoi ?? 0 },
    ],
    [stats]
  );

  const handleApprove = async (company: AdminCompany) => {
    const confirmed = window.confirm(`Duyệt công ty ${company.ten}?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    try {
      await adminService.approveCompany(company.id);
      toast.success("Đã duyệt công ty.");
      await loadData();
    } catch {
      toast.error("Không thể duyệt công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleViewDetail = async (company: AdminCompany) => {
    setIsDetailLoading(true);
    try {
      const detail = await adminService.getCompanyDetail(company.id);
      setSelectedCompany(detail);
    } catch {
      toast.error("Không thể tải chi tiết công ty.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingCompany || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    setIsMutating(true);
    try {
      await adminService.rejectCompany(rejectingCompany.id, { lyDoTuChoi: rejectReason.trim() });
      toast.success("Đã từ chối công ty.");
      setRejectingCompany(null);
      setRejectReason("");
      await loadData();
    } catch {
      toast.error("Không thể từ chối công ty.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Doanh nghiệp"
        title="Duyệt Hồ Sơ Công Ty"
        subtitle="Xử lý luồng phê duyệt doanh nghiệp theo trạng thái và kiểm tra minh chứng pháp lý."
      />

      <CompanyStatsCards items={statsCards} />

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <CompanyFilters status={status} onStatusChange={setStatus} onReload={() => void loadData()} />
        <CompanyTable
          companies={companies}
          isLoading={isLoading}
          isMutating={isMutating}
          isDetailLoading={isDetailLoading}
          onViewDetail={(company) => void handleViewDetail(company)}
          onApprove={(company) => void handleApprove(company)}
          onReject={(company) => setRejectingCompany(company)}
        />
      </section>

      {selectedCompany ? (
        <CompanyDetailModal
          company={selectedCompany}
          isMutating={isMutating}
          onClose={() => setSelectedCompany(null)}
          onApprove={async () => {
            await handleApprove(selectedCompany.company);
            setSelectedCompany(null);
          }}
          onReject={async () => {
            setRejectingCompany(selectedCompany.company);
            setSelectedCompany(null);
          }}
        />
      ) : null}

      {rejectingCompany ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Từ chối công ty</h3>
            <p className="mt-1 text-sm text-slate-600">Nhập lý do từ chối cho {rejectingCompany.ten}.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Lý do từ chối..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  setRejectingCompany(null);
                  setRejectReason("");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => void handleReject()}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white"
              >
                {isMutating ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
