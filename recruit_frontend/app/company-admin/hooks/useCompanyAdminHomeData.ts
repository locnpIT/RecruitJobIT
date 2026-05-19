"use client";

import { useEffect, useMemo, useState } from "react";
import {
  companyAdminService,
} from "@/services/company-admin.service";
import type { CompanyAdminBranch, CompanyAdminMeResponse } from "@/services/company-admin/types";
import { isCompanyApproved } from "../company-admin-status";

// Dùng cho màn company-admin dashboard: nạp snapshot công ty và danh sách chi nhánh (khi đã duyệt).
export function useCompanyAdminHomeData() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then(async (response) => {
        if (!active) {
          return;
        }
        setData(response);

        if (isCompanyApproved(response.congTy.trangThai)) {
          const responseBranches = await companyAdminService.getBranches();
          if (!active) {
            return;
          }
          setBranches(responseBranches);
        } else {
          setBranches([]);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("Không tải được dữ liệu công ty.");
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

  const visibleBranches = useMemo(
    () => (branches.length > 0 ? branches : data?.chiNhanhs ?? []),
    [branches, data?.chiNhanhs],
  );
  const branchCount = visibleBranches.length;
  const primaryBranch = visibleBranches.find((branch) => branch.laTruSoChinh) ?? visibleBranches[0] ?? null;
  const companyLogo = data?.congTy.logoUrl ?? null;
  const companyApproved = isCompanyApproved(data?.congTy.trangThai);
  const companyRejected = data?.congTy.trangThai?.toUpperCase() === "REJECTED";
  const companyCanPostJobs = Boolean(data?.congTy.coQuyenDangBai);

  return {
    data,
    visibleBranches,
    branchCount,
    primaryBranch,
    companyLogo,
    companyApproved,
    companyRejected,
    companyCanPostJobs,
    isLoading,
    error,
  };
}
