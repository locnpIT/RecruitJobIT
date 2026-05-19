"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { companyAdminJobsService } from "@/services/company-admin/jobs.service";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";
import type {
  CompanyAdminBranch,
  CompanyAdminJob,
  CompanyJobMetadataOption,
} from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";

// Dùng cho màn company-admin/jobs: nạp company status, branches, metadata và danh sách job theo branch.
export function useCompanyAdminJobsData() {
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<CompanyAdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [canPostJobs, setCanPostJobs] = useState(true);
  const [nganhNgheOptions, setNganhNgheOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [loaiHinhOptions, setLoaiHinhOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [capDoOptions, setCapDoOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [kyNangOptions, setKyNangOptions] = useState<CompanyJobMetadataOption[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const response = await companyAdminSettingsService.getMe();
        if (!active) {
          return;
        }

        setCompanyStatus(response.congTy.trangThai ?? null);
        setCanPostJobs(Boolean(response.congTy.coQuyenDangBai));

        if (!isCompanyApproved(response.congTy.trangThai)) {
          setIsLoadingJobs(false);
          return;
        }

        const [responseBranches, metadata] = await Promise.all([
          companyAdminSettingsService.getBranches(),
          companyAdminJobsService.getJobMetadata(),
        ]);

        if (!active) {
          return;
        }

        setBranches(responseBranches);
        const firstBranchId = responseBranches[0]?.chiNhanhId ?? null;
        setSelectedBranchId(firstBranchId);
        if (!firstBranchId) {
          setIsLoadingJobs(false);
        }

        setNganhNgheOptions(metadata.nganhNghes ?? []);
        setLoaiHinhOptions(metadata.loaiHinhLamViecs ?? []);
        setCapDoOptions(metadata.capDoKinhNghiems ?? []);
        setKyNangOptions(metadata.kyNangs ?? []);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(getApiErrorMessage(loadError, "Không tải được dữ liệu quản lý tin tuyển dụng."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    let active = true;

    const loadJobs = async () => {
      try {
        const response = await companyAdminJobsService.getJobs(selectedBranchId);
        if (!active) {
          return;
        }
        setJobs(response);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(getApiErrorMessage(loadError, "Không tải được danh sách tin tuyển dụng."));
      } finally {
        if (active) {
          setIsLoadingJobs(false);
        }
      }
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.chiNhanhId === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const handleSelectBranch = (nextBranchId: number) => {
    setIsLoadingJobs(true);
    setSelectedBranchId(nextBranchId);
  };

  return {
    branches,
    selectedBranchId,
    selectedBranch,
    jobs,
    setJobs,
    isLoading,
    isLoadingJobs,
    companyStatus,
    canPostJobs,
    nganhNgheOptions,
    loaiHinhOptions,
    capDoOptions,
    kyNangOptions,
    error,
    setIsLoadingJobs,
    handleSelectBranch,
  };
}
