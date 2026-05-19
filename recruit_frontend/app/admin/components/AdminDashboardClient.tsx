"use client";

import { QuickActions } from "./QuickActions";
import { RecentApprovalsTable } from "./RecentApprovalsTable";
import { StatsGrid } from "./StatsGrid";
import { SystemActivity } from "./SystemActivity";
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

/**
 * Container dữ liệu của dashboard admin.
 * File này chịu trách nhiệm gọi API, chuyển đổi response sang shape UI
 * và chia dữ liệu cho các component trình bày bên dưới.
 */
export function AdminDashboardClient() {
  const dashboardData = useAdminDashboardData();

  const quickActions = [
    { label: "Duyệt công ty", href: "/admin/companies", hint: "Xử lý doanh nghiệp đang chờ duyệt" },
    { label: "Duyệt tin tuyển dụng", href: "/admin/jobs", hint: "Rà soát tin mới được gửi" },
    { label: "Người dùng bị khóa", href: "/admin/users?status=INACTIVE", hint: "Kiểm tra và mở khóa tài khoản" },
  ];

  return (
    <>
      <StatsGrid items={dashboardData.statsCards} />

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <RecentApprovalsTable rows={dashboardData.recentCompanies} />
          {/* Giữ thông báo loading cạnh bảng để không làm layout nhảy quá mạnh. */}
          {dashboardData.isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Đang tải dữ liệu tổng quan...
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <SystemActivity items={dashboardData.systemActivity} />
          <QuickActions actions={quickActions} />
        </div>
      </section>
    </>
  );
}
