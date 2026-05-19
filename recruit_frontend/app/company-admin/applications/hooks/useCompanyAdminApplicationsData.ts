"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminApplicationsService } from "@/services/company-admin/applications.service";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";
import type { CompanyAdminApplication, CompanyAdminBranch } from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";
import type { ApplicationFiltersValue } from "../components/ApplicationFilters";

export const DEFAULT_APPLICATION_FILTERS: ApplicationFiltersValue = {
  status: "",
  jobId: "",
  fromDate: "",
  toDate: "",
};

// Dùng cho màn company-admin/applications: load me + branches + applications và filter local.
export function useCompanyAdminApplicationsData() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [applications, setApplications] = useState<CompanyAdminApplication[]>([]);
  const [filters, setFilters] = useState<ApplicationFiltersValue>(DEFAULT_APPLICATION_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    companyAdminSettingsService
      .getMe()
      .then((response) => {
        if (!active) {
          return;
        }
        setCompanyStatus(response.congTy.trangThai ?? null);

        if (!isCompanyApproved(response.congTy.trangThai)) {
          setIsLoadingApplications(false);
          return;
        }

        return companyAdminSettingsService.getBranches().then((responseBranches) => {
          if (!active) {
            return;
          }
          setBranches(responseBranches);
          const firstBranchId = responseBranches[0]?.chiNhanhId ?? null;
          setSelectedBranchId(firstBranchId);
          if (!firstBranchId) {
            setIsLoadingApplications(false);
          }
        });
      })
      .catch((loadError) => {
        if (active) {
          setError(getApiErrorMessage(loadError, "Không tải được thông tin công ty."));
        }
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

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) {
          return null;
        }
        setIsLoadingApplications(true);
        setFilters(DEFAULT_APPLICATION_FILTERS);
        return companyAdminApplicationsService.getApplications(selectedBranchId);
      })
      .then((response) => {
        if (!active || !response) {
          return;
        }
        setApplications(response);
        setError("");
      })
      .catch((loadError) => {
        if (active) {
          setError(getApiErrorMessage(loadError, "Không tải được danh sách đơn ứng tuyển."));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingApplications(false);
        }
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

  return {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    applications,
    setApplications,
    filters,
    setFilters,
    isLoading,
    isLoadingApplications,
    companyStatus,
    error,
    setError,
    selectedBranch,
    filteredApplications,
  };
}
