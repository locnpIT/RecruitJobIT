"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { companyAdminService, type CompanyAdminApplication, type CompanyAdminBranch } from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";

/**
 * Trang xem đơn ứng tuyển theo chi nhánh.
 * Vì dữ liệu application gắn chặt với phạm vi chi nhánh nên UI bắt người dùng chọn branch trước.
 */
export default function CompanyAdminApplicationsPage() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [applications, setApplications] = useState<CompanyAdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        setCompanyStatus(response.congTy.trangThai ?? null);

        // Chặn sớm luồng tải branch/application nếu công ty chưa đủ điều kiện vận hành.
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
    // Đổi chi nhánh là đổi hoàn toàn scope dữ liệu ứng tuyển.
    companyAdminService.getApplications(selectedBranchId)
      .then((response) => {
        if (active) setApplications(response);
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
      </header>

      <div>
        <label className="block text-sm font-medium text-slate-700">Chọn chi nhánh</label>
        <select
          value={selectedBranchId ?? ""}
          onChange={(event) => {
            setIsLoadingApplications(true);
            setSelectedBranchId(Number(event.target.value));
          }}
          className="mt-2 w-full border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {branches.map((branch) => (
            <option key={branch.chiNhanhId} value={branch.chiNhanhId ?? ""}>
              {branch.chiNhanhTen} {branch.vaiTroCongTy ? `(${branch.vaiTroCongTy})` : ""}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          {selectedBranch ? `${selectedBranch.chiNhanhTen} - ${selectedBranch.congTyTen}` : "Chưa chọn chi nhánh"}
        </p>
      </div>

      {isLoadingApplications ? (
        <div className="flex items-center justify-center border border-slate-200 p-8 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải ứng tuyển...
        </div>
      ) : (
        <div>
          {!applications.length ? (
            <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Chưa có đơn ứng tuyển cho chi nhánh này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-left text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 font-normal">Ứng viên</th>
                    <th className="py-3 font-normal">Email</th>
                    <th className="py-3 font-normal">Tin tuyển dụng</th>
                    <th className="py-3 font-normal">Chi nhánh</th>
                    <th className="py-3 font-normal">Trạng thái</th>
                    <th className="py-3 font-normal">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id ?? `${application.tinTuyenDungId}-${application.nguoiDungId}`} className="border-b border-slate-200">
                      <td className="py-3 pl-4 font-medium text-slate-900">{application.ungVienHoTen ?? "--"}</td>
                      <td className="py-3 text-slate-600">{application.ungVienEmail ?? "--"}</td>
                      <td className="py-3 text-slate-600">{application.tieuDeTinTuyenDung ?? "--"}</td>
                      <td className="py-3 text-slate-600">{application.chiNhanhTen ?? "--"}</td>
                      <td className="py-3 text-slate-600">{application.trangThai ?? "--"}</td>
                      <td className="py-3 text-slate-600">{application.ngayTao ?? "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
