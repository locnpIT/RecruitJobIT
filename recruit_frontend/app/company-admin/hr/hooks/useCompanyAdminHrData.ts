"use client";

import { useEffect, useState } from "react";
import {
  companyAdminService,
} from "@/services/company-admin.service";
import type { CompanyAdminBranch, CompanyAdminHrAccount } from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";

// Dùng cho màn company-admin/hr: nạp dữ liệu trạng thái công ty + danh sách chi nhánh + danh sách HR.
export function useCompanyAdminHrData() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [hrs, setHrs] = useState<CompanyAdminHrAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        return Promise.all([companyAdminService.getBranches(), companyAdminService.getHrs()]).then(([branchData, hrData]) => {
          if (!active) {
            return;
          }
          setBranches(branchData);
          setHrs(hrData);
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("Không tải được dữ liệu nhân sự.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    branches,
    hrs,
    isLoading,
    error,
    companyStatus,
    setHrs,
  };
}
