"use client";

import { useEffect, useState } from "react";
import { companyAdminService } from "@/services/company-admin.service";
import type { CompanyAdminBranch } from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";

// Dùng cho màn company-admin/branches: nạp trạng thái công ty và danh sách chi nhánh (khi đã duyệt).
export function useCompanyAdminBranchesData() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then((response) => {
        if (!active) {
          return;
        }
        setCompanyStatus(response.congTy.trangThai ?? null);

        if (!isCompanyApproved(response.congTy.trangThai)) {
          return;
        }

        return companyAdminService.getBranches().then((responseBranches) => {
          if (active) {
            setBranches(responseBranches);
          }
        });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    branches,
    isLoading,
    companyStatus,
  };
}
