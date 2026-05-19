"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import type { AdminCompany, AdminStatsResponse } from "@/services/admin/types";
import type { DuyetGanDayItem, ThongKeNhanhItem } from "../types";

// Dùng cho màn admin dashboard: nạp stats + companies và map về dữ liệu UI.
export function useAdminDashboardData() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResponse, companiesResponse] = await Promise.all([
        adminService.getStats(),
        adminService.listCompanies(),
      ]);

      setStats(statsResponse);
      setCompanies(companiesResponse);
    } catch {
      toast.error("Không tải được dữ liệu tổng quan admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const statsCards: ThongKeNhanhItem[] = useMemo(() => {
    const tongNguoiDung = stats?.tongNguoiDung ?? 0;
    const nguoiDungHoatDong = stats?.nguoiDungHoatDong ?? 0;
    const tongCongTy = stats?.tongCongTy ?? 0;
    const congTyChoDuyet = stats?.congTyChoDuyet ?? 0;
    const congTyDaDuyet = stats?.congTyDaDuyet ?? 0;
    const congTyBiTuChoi = stats?.congTyBiTuChoi ?? 0;

    return [
      {
        label: "Người dùng",
        value: tongNguoiDung.toString(),
        description: `${nguoiDungHoatDong} đang hoạt động`,
      },
      {
        label: "Công ty",
        value: tongCongTy.toString(),
        description: `${congTyDaDuyet} đã duyệt`,
      },
      {
        label: "Chờ duyệt",
        value: congTyChoDuyet.toString(),
        description: `${congTyBiTuChoi} bị từ chối`,
      },
      {
        label: "Tài khoản khóa",
        value: (tongNguoiDung - nguoiDungHoatDong).toString(),
        description: "Cập nhật theo trạng thái người dùng",
      },
    ];
  }, [stats]);

  const recentCompanies: DuyetGanDayItem[] = useMemo(() => {
    return companies.slice(0, 4).map((company) => ({
      ten: company.ten,
      congTy: company.chuCongTyHoTen || company.chuCongTyEmail || "--",
      trangThai: company.trangThai as DuyetGanDayItem["trangThai"],
      ngay: new Date(company.ngayTao).toLocaleDateString("vi-VN"),
    }));
  }, [companies]);

  const systemActivity = useMemo(() => {
    const pendingCount = stats?.congTyChoDuyet ?? 0;
    const approvedCount = stats?.congTyDaDuyet ?? 0;
    const rejectedCount = stats?.congTyBiTuChoi ?? 0;
    const activeUsers = stats?.nguoiDungHoatDong ?? 0;

    return [
      `${pendingCount} công ty đang chờ duyệt`,
      `${approvedCount} công ty đã được phê duyệt`,
      `${rejectedCount} công ty bị từ chối`,
      `${activeUsers} người dùng đang hoạt động`,
    ];
  }, [stats]);

  return {
    isLoading,
    statsCards,
    recentCompanies,
    systemActivity,
  };
}
