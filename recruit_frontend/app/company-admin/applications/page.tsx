"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";

import { companyAdminService, type CompanyAdminApplication, type CompanyAdminBranch } from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";
import { ApplicationDetailModal } from "./components/ApplicationDetailModal";
import { ApplicationFilters, type ApplicationFiltersValue } from "./components/ApplicationFilters";
import { ApplicationStatusBadge } from "./components/ApplicationStatusBadge";

const DEFAULT_FILTERS: ApplicationFiltersValue = {
  status: "",
  jobId: "",
  fromDate: "",
  toDate: "",
};

/**
 * Trang xem đơn ứng tuyển theo chi nhánh.
 *
 * Luồng hiện tại:
 * - Owner/HR chọn chi nhánh được phép quản lý.
 * - Frontend lấy đơn ứng tuyển của chi nhánh đó.
 * - Filter theo tin, trạng thái, ngày ứng tuyển chạy local trên dữ liệu đã tải.
 * - Modal detail gọi API riêng để xem hồ sơ ứng viên, CV, học vấn, chứng chỉ và kỹ năng.
 */
export default function CompanyAdminApplicationsPage() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [applications, setApplications] = useState<CompanyAdminApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CompanyAdminApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState<ApplicationFiltersValue>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        setCompanyStatus(response.congTy.trangThai ?? null);

        // Công ty chưa duyệt thì không tải branch/application để tránh gọi API chắc chắn bị chặn nghiệp vụ.
        if (!isCompanyApproved(response.congTy.trangThai)) {
          setIsLoadingApplications(false);
          return;
        }

        return companyAdminService.getBranches()
          .then((responseBranches) => {
            if (!active) return;
            setBranches(responseBranches);
            const firstBranchId = responseBranches[0]?.chiNhanhId ?? null;
            setSelectedBranchId(firstBranchId);
            if (!firstBranchId) {
              setIsLoadingApplications(false);
            }
          });
      })
      .catch(() => {
        if (active) setError("Không tải được thông tin công ty.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    let active = true;
    // Đổi chi nhánh là đổi scope dữ liệu ứng tuyển; defer setState để tránh cascading render trong effect.
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setIsLoadingApplications(true);
        setFilters(DEFAULT_FILTERS);
        return companyAdminService.getApplications(selectedBranchId);
      })
      .then((response) => {
        if (!active || !response) return;
        setApplications(response);
        setError("");
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách đơn ứng tuyển.");
      })
      .finally(() => {
        if (active) setIsLoadingApplications(false);
      });
    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((item) => item.chiNhanhId === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const statusMatches = !filters.status || application.trangThai?.toUpperCase() === filters.status;
      const jobMatches = !filters.jobId || String(application.tinTuyenDungId) === filters.jobId;
      const createdDate = application.ngayTao ? application.ngayTao.slice(0, 10) : "";
      const fromMatches = !filters.fromDate || createdDate >= filters.fromDate;
      const toMatches = !filters.toDate || createdDate <= filters.toDate;

      return statusMatches && jobMatches && fromMatches && toMatches;
    });
  }, [applications, filters]);

  // Mở modal chi tiết và tải payload đầy đủ của hồ sơ ứng viên trong đơn.
  const handleOpenDetail = async (applicationId: number | null) => {
    if (!applicationId) {
      return;
    }

    setDetailOpen(true);
    setIsLoadingDetail(true);
    setSelectedApplication(null);
    try {
      const detail = await companyAdminService.getApplicationDetail(applicationId);
      setSelectedApplication(detail);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Cập nhật trạng thái pipeline tuyển dụng bằng cột DonUngTuyen.trangThai hiện có.
  const handleStatusChange = async (status: string) => {
    if (!selectedApplication?.id) {
      return;
    }

    setIsSavingStatus(true);
    try {
      const updated = await companyAdminService.updateApplicationStatus(selectedApplication.id, status);
      setSelectedApplication(updated);
      setApplications((current) => current.map((item) => item.id === updated.id ? { ...item, trangThai: updated.trangThai } : item));
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!isCompanyApproved(companyStatus)) {
    return (
      <div className="space-y-5 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ứng viên</p>
          <h1 className="mt-2 text-2xl font-semibold">Đơn ứng tuyển theo chi nhánh</h1>
        </header>
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-900">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ứng viên</p>
        <h1 className="mt-2 text-2xl font-semibold">Đơn ứng tuyển theo chi nhánh</h1>
        <p className="mt-2 text-sm text-slate-600">
          Xem hồ sơ ứng viên, tải CV và cập nhật trạng thái xử lý đơn trong phạm vi chi nhánh được phân quyền.
        </p>
      </header>

      <ApplicationFilters
        branches={branches}
        applications={applications}
        selectedBranchId={selectedBranchId}
        filters={filters}
        onBranchChange={setSelectedBranchId}
        onFiltersChange={setFilters}
      />

      <p className="text-xs text-slate-500">
        {selectedBranch ? `${selectedBranch.chiNhanhTen} - ${selectedBranch.congTyTen}` : "Chưa chọn chi nhánh"}
      </p>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoadingApplications ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải ứng tuyển...
        </div>
      ) : (
        <div>
          {!filteredApplications.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có đơn ứng tuyển phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 font-medium">Ứng viên</th>
                    <th className="py-3 font-medium">Tin tuyển dụng</th>
                    <th className="py-3 font-medium">CV</th>
                    <th className="py-3 font-medium">Trạng thái</th>
                    <th className="py-3 font-medium">Thời gian</th>
                    <th className="py-3 pr-4 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr key={application.id ?? `${application.tinTuyenDungId}-${application.nguoiDungId}`} className="border-b border-slate-200 last:border-0">
                      <td className="py-3 pl-4">
                        <p className="font-medium text-slate-900">{application.ungVienHoTen ?? "--"}</p>
                        <p className="text-xs text-slate-500">{application.ungVienEmail ?? "--"}</p>
                      </td>
                      <td className="max-w-xs py-3 text-slate-600">{application.tieuDeTinTuyenDung ?? "--"}</td>
                      <td className="py-3 text-slate-600">
                        {application.cvUrl ? (
                          <a href={application.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-800 hover:underline">
                            <Download className="h-4 w-4" />
                            Tải CV
                          </a>
                        ) : (
                          <span className="text-slate-400">Không có</span>
                        )}
                      </td>
                      <td className="py-3"><ApplicationStatusBadge status={application.trangThai} /></td>
                      <td className="py-3 text-slate-600">{formatDateTime(application.ngayTao)}</td>
                      <td className="py-3 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(application.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ApplicationDetailModal
        open={detailOpen}
        application={selectedApplication}
        loading={isLoadingDetail}
        savingStatus={isSavingStatus}
        onClose={() => setDetailOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString("vi-VN");
}
