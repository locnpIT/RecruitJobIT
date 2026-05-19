"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminCompaniesService } from "@/services/admin/companies.service";
import { adminStatsService } from "@/services/admin/stats.service";
import type { AdminCompany, AdminStatsResponse } from "@/services/admin/types";

// Dùng cho màn admin/companies: load stats + list company theo trạng thái.
export function useAdminCompaniesData() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, companiesResponse] = await Promise.all([
        adminStatsService.getStats(),
        adminCompaniesService.listCompanies({ status: status || undefined }),
      ]);
      setStats(statsResponse);
      setCompanies(companiesResponse);
    } catch {
      toast.error("Không tải được dữ liệu công ty.");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const statsCards = useMemo(
    () => [
      { label: "Tổng công ty", value: stats?.tongCongTy ?? 0 },
      { label: "Chờ duyệt", value: stats?.congTyChoDuyet ?? 0 },
      { label: "Đã duyệt", value: stats?.congTyDaDuyet ?? 0 },
      { label: "Bị từ chối", value: stats?.congTyBiTuChoi ?? 0 },
    ],
    [stats],
  );

  return {
    companies,
    status,
    isLoading,
    setStatus,
    loadData,
    statsCards,
  };
}
