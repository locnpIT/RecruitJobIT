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
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, companiesResponse] = await Promise.all([
        adminStatsService.getStats(),
        adminCompaniesService.listCompanies({
          status: status || undefined,
          keyword: debouncedKeyword || undefined,
        }),
      ]);
      setStats(statsResponse);
      setCompanies(companiesResponse);
    } catch {
      toast.error("Không tải được dữ liệu công ty.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedKeyword, status]);

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
    keyword,
    isLoading,
    setKeyword,
    setStatus,
    loadData,
    statsCards,
  };
}
