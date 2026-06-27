"use client";

import { useEffect, useMemo, useState } from "react";
import {
  companyAdminService,
} from "@/services/company-admin/company-admin.service";
import { companyAdminApplicationsService } from "@/services/company-admin/applications.service";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import type { CompanyAdminApplication, CompanyAdminBranch, CompanyAdminJob, CompanyAdminMeResponse } from "@/services/company-admin/types";
import { isCompanyApproved } from "../company-admin-status";

// Dùng cho màn company-admin dashboard: nạp snapshot công ty và danh sách chi nhánh (khi đã duyệt).
export function useCompanyAdminHomeData() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [branchSummary, setBranchSummary] = useState<
    Array<{
      branchId: number;
      branchName: string;
      jobs: CompanyAdminJob[];
      applications: CompanyAdminApplication[];
    }>
  >([]);
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

          const branchIds = responseBranches.map((branch) => branch.chiNhanhId).filter((id): id is number => id != null);
          if (branchIds.length > 0) {
            const [jobsByBranch, applicationsByBranch] = await Promise.all([
              Promise.all(branchIds.map((branchId) => companyAdminJobsService.getJobs(branchId))),
              Promise.all(branchIds.map((branchId) => companyAdminApplicationsService.getApplications(branchId))),
            ]);

            if (!active) {
              return;
            }

            const summaries = responseBranches
              .map((branch, index) => ({
                branchId: branch.chiNhanhId,
                branchName: branch.chiNhanhTen ?? `Chi nhánh ${branch.chiNhanhId ?? index + 1}`,
                jobs: jobsByBranch[index] ?? [],
                applications: applicationsByBranch[index] ?? [],
              }))
              .filter((item): item is {
                branchId: number;
                branchName: string;
                jobs: CompanyAdminJob[];
                applications: CompanyAdminApplication[];
              } => item.branchId != null);

            setBranchSummary(summaries);
          } else {
            setBranchSummary([]);
          }
        } else {
          setBranches([]);
          setBranchSummary([]);
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
    branchSummary,
    isLoading,
    error,
  };
}

