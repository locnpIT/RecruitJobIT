"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminPackagesService } from "@/services/admin/packages.service";
import type { AdminPackage, AdminPackageSubscription } from "@/services/admin/types";

// Dùng cho màn admin/plans: nạp danh sách package + đăng ký gần đây + thống kê.
export function useAdminPlansData() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminPackageSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [packageData, subscriptionData] = await Promise.all([
        adminPackagesService.listPackages(),
        adminPackagesService.listPackageSubscriptions(),
      ]);
      setPackages(packageData);
      setSubscriptions(subscriptionData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được dữ liệu gói."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const packageStats = useMemo(() => {
    const active = packages.length;
    const inUse = packages.reduce((sum, pkg) => sum + (pkg.soCongTyDangSuDung ?? 0), 0);
    return { active, inUse };
  }, [packages]);

  return {
    packages,
    subscriptions,
    isLoading,
    error,
    packageStats,
    loadData,
  };
}
