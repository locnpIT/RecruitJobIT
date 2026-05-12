"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { adminService, type AdminCompany, type AdminStatsResponse } from "@/services/admin.service";
import { QuickActions } from "./QuickActions";
import { RecentApprovalsTable } from "./RecentApprovalsTable";
import { StatsGrid } from "./StatsGrid";
import { SystemActivity } from "./SystemActivity";
import type { DuyetGanDayItem, ThongKeNhanhItem } from "../types";

/**
 * Container dữ liệu của dashboard admin.
 * File này chịu trách nhiệm gọi API, chuyển đổi response sang shape UI
 * và chia dữ liệu cho các component trình bày bên dưới.
 */
export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Dashboard tổng hợp 2 nguồn dữ liệu chính:
   * - số liệu thống kê nhanh
   * - danh sách công ty để dựng bảng duyệt gần đây
   */
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
    // Dashboard chỉ hiển thị một lát cắt ngắn, không dùng toàn bộ danh sách công ty.
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

  const quickActions = [
    { label: "Duyệt công ty", href: "/admin/companies", hint: "Xử lý doanh nghiệp đang chờ duyệt" },
    { label: "Duyệt tin tuyển dụng", href: "/admin/jobs", hint: "Rà soát tin mới được gửi" },
    { label: "Người dùng bị khóa", href: "/admin/users?status=INACTIVE", hint: "Kiểm tra và mở khóa tài khoản" },
    { label: "Báo cáo hệ thống", href: "/admin/reports", hint: "Theo dõi chỉ số vận hành" },
  ];

  return (
    <>
      <StatsGrid items={statsCards} />

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <RecentApprovalsTable rows={recentCompanies} />
          {/* Giữ thông báo loading cạnh bảng để không làm layout nhảy quá mạnh. */}
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Đang tải dữ liệu tổng quan...
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <SystemActivity items={systemActivity} />
          <QuickActions actions={quickActions} />
        </div>
      </section>
    </>
  );
}
