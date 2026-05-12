"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { companyAdminService, type CompanyAdminBranch } from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";

/**
 * Trang liệt kê chi nhánh mà người dùng doanh nghiệp có thể truy cập.
 * Owner thấy toàn bộ chi nhánh, còn HR thường chỉ thấy những chi nhánh có membership.
 */
export default function CompanyAdminBranchesPage() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        setCompanyStatus(response.congTy.trangThai ?? null);

        // Nếu công ty chưa duyệt thì không gọi tiếp API chi nhánh để tránh request thừa.
        if (!isCompanyApproved(response.congTy.trangThai)) {
          return;
        }

        return companyAdminService.getBranches()
          .then((responseBranches) => {
            if (active) setBranches(responseBranches);
          });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải chi nhánh...
      </div>
    );
  }

  if (!isCompanyApproved(companyStatus)) {
    return (
      <div className="space-y-5 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Chi nhánh</p>
          <h1 className="mt-2 text-2xl font-semibold">Danh sách chi nhánh</h1>
        </header>
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-900">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Chi nhánh</p>
        <h1 className="mt-2 text-2xl font-semibold">Danh sách chi nhánh</h1>
      </header>

      {!branches.length ? (
        <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Chưa có chi nhánh nào được trả về từ hệ thống.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="py-3 pl-4 font-normal">Tên</th>
                <th className="py-3 font-normal">Vai trò</th>
                <th className="py-3 font-normal">Công ty</th>
                <th className="py-3 font-normal">Chính</th>
                <th className="py-3 font-normal">Trạng thái</th>
                <th className="py-3 font-normal">ID</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={`${branch.chiNhanhId}-${branch.vaiTroCongTy}`} className="border-b border-slate-200">
                  <td className="py-3 pl-4 font-medium text-slate-900">{branch.chiNhanhTen ?? "--"}</td>
                  <td className="py-3 text-slate-600">{branch.vaiTroCongTy ?? "--"}</td>
                  <td className="py-3 text-slate-600">{branch.congTyTen ?? "--"}</td>
                  <td className="py-3 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"}</td>
                  <td className="py-3 text-slate-600">{branch.trangThai ?? "--"}</td>
                  <td className="py-3 text-slate-600">{branch.chiNhanhId?.toString() ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
