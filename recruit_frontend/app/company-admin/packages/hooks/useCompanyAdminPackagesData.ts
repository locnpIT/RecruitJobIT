"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  companyAdminService,
} from "@/services/company-admin/company-admin.service";
import type {
  CompanyAdminMeResponse,
  CompanyPackageOverview,
  CompanyPackageRegistration,
} from "@/services/company-admin/types";
import { isCompanyApproved } from "../../company-admin-status";

// Dùng cho màn company-admin/packages: nạp dữ liệu gói, kiểm tra quyền OWNER và polling trạng thái thanh toán.
export function useCompanyAdminPackagesData() {
  const [me, setMe] = useState<CompanyAdminMeResponse | null>(null);
  const [overview, setOverview] = useState<CompanyPackageOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestPayment, setLatestPayment] = useState<CompanyPackageRegistration | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then(async (meResponse) => {
        if (!active) {
          return;
        }
        setMe(meResponse);

        const isOwner = meResponse.chiNhanhs?.some((branch) => branch.vaiTroCongTy?.toUpperCase() === "OWNER") ?? false;
        if (!isOwner || !isCompanyApproved(meResponse.congTy.trangThai)) {
          return;
        }

        const packageResponse = await companyAdminService.getCompanyPackages();
        if (!active) {
          return;
        }
        setOverview(packageResponse);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("Không tải được dữ liệu gói công ty.");
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

  const company = me?.congTy ?? null;
  const isApproved = isCompanyApproved(company?.trangThai);
  const isOwner = useMemo(
    () => me?.chiNhanhs?.some((branch) => branch.vaiTroCongTy?.toUpperCase() === "OWNER") ?? false,
    [me?.chiNhanhs],
  );

  useEffect(() => {
    if (!latestPayment?.id) {
      return;
    }

    const paidStatuses = new Set(["PAID", "SUCCESS", "COMPLETED", "DONE"]);
    const currentStatus = latestPayment.trangThaiThanhToan?.toUpperCase() ?? "";
    if (paidStatuses.has(currentStatus)) {
      return;
    }

    let stopped = false;
    const intervalId = window.setInterval(async () => {
      try {
        const refreshed = await companyAdminService.getCompanyPackages();
        if (stopped) {
          return;
        }

        setOverview(refreshed);
        const currentPackage = refreshed.goiHienTai;
        if (!currentPackage || currentPackage.id !== latestPayment.id) {
          return;
        }

        setLatestPayment(currentPackage);
        const refreshedStatus = currentPackage.trangThaiThanhToan?.toUpperCase() ?? "";
        if (paidStatuses.has(refreshedStatus)) {
          toast.success("Thanh toán thành công. Gói đã được kích hoạt.");
          window.clearInterval(intervalId);
        }
      } catch {
        // Keep polling on transient errors.
      }
    }, 5000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [latestPayment]);

  return {
    me,
    overview,
    isLoading,
    error,
    latestPayment,
    isApproved,
    isOwner,
    setOverview,
    setLatestPayment,
  };
}
