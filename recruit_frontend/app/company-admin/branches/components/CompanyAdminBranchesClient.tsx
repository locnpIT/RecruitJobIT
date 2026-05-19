"use client";

import { Loader2 } from "lucide-react";
import { CompanyAdminRestrictedNotice } from "../../components/CompanyAdminRestrictedNotice";
import { isCompanyApproved } from "../../company-admin-status";
import { BranchesPageHeader } from "./BranchesPageHeader";
import { BranchesTable } from "./BranchesTable";
import { useCompanyAdminBranchesData } from "../hooks/useCompanyAdminBranchesData";

// Client container cho trang /company-admin/branches.
export function CompanyAdminBranchesClient() {
  const data = useCompanyAdminBranchesData();

  if (data.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải chi nhánh...
      </div>
    );
  }

  if (!isCompanyApproved(data.companyStatus)) {
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
      <BranchesTable branches={data.branches} />
    </div>
  );
}
