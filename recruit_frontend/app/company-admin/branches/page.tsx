"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { companyAdminService, type CompanyAdminBranch } from "@/services/company-admin.service";
import { isCompanyApproved } from "../company-admin-status";
import { CompanyAdminRestrictedNotice } from "../components/CompanyAdminRestrictedNotice";
import { BranchesPageHeader } from "./components/BranchesPageHeader";
import { BranchesTable } from "./components/BranchesTable";

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
        <BranchesPageHeader title="Danh sách chi nhánh" />
        <CompanyAdminRestrictedNotice />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-900">
      <BranchesPageHeader title="Danh sách chi nhánh" />
      <BranchesTable branches={branches} />
    </div>
  );
}
