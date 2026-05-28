"use client";

import { useState } from "react";
import { QuickActions } from "./QuickActions";
import { RecentApprovalsTable } from "./RecentApprovalsTable";
import { StatsGrid } from "./StatsGrid";
import { SystemActivity } from "./SystemActivity";
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";
import { SimpleChartCard } from "@/components/charts/SimpleChartCard";
import { TREND_RANGE_OPTIONS, type TrendRangeDays } from "@/components/charts/chartTimeSeries";

/**
 * Container dữ liệu của dashboard admin.
 * File này chịu trách nhiệm gọi API, chuyển đổi response sang shape UI
 * và chia dữ liệu cho các component trình bày bên dưới.
 */
export function AdminDashboardClient() {
  const dashboardData = useAdminDashboardData();
  const [trendRange, setTrendRange] = useState<TrendRangeDays>(7);
  const companyTrendChart = dashboardData.buildCompanyTrendChart(trendRange);

  const quickActions = [
    { label: "Duyệt công ty", href: "/admin/companies", hint: "Xử lý doanh nghiệp đang chờ duyệt" },
    { label: "Duyệt tin tuyển dụng", href: "/admin/jobs", hint: "Rà soát tin mới được gửi" },
    { label: "Người dùng bị khóa", href: "/admin/users?status=INACTIVE", hint: "Kiểm tra và mở khóa tài khoản" },
  ];

  return (
    <>
      <StatsGrid items={dashboardData.statsCards} />

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimpleChartCard
          title="Trạng thái công ty"
          description="Tỷ lệ công ty chờ duyệt, đã duyệt và bị từ chối."
          kind="doughnut"
          labels={dashboardData.companyChart.labels}
          values={dashboardData.companyChart.values}
          colors={dashboardData.companyChart.colors}
          footer="Nguồn dữ liệu từ `GET /admin/stats`."
        />
        <SimpleChartCard
          title="Trạng thái người dùng"
          description="Phân bố tài khoản đang hoạt động và bị khóa."
          kind="bar"
          labels={dashboardData.userChart.labels}
          values={dashboardData.userChart.values}
          colors={dashboardData.userChart.colors}
          footer="Dữ liệu phản ánh tổng quan truy cập hệ thống."
        />
      </section>

      <section className="mt-5">
        <SimpleChartCard
          title="Công ty đăng ký theo ngày"
          description="Chọn khoảng thời gian để xem xu hướng công ty tạo mới."
          kind="line"
          labels={companyTrendChart.labels}
          values={companyTrendChart.values}
          colors={companyTrendChart.colors}
          heightClassName="h-80"
          headerRight={
            <SelectRange value={trendRange} onChange={setTrendRange} />
          }
          footer="Dùng ngày tạo của công ty để dựng trend theo thời gian."
        />
      </section>

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

function SelectRange({
  value,
  onChange,
}: {
  value: TrendRangeDays;
  onChange: (value: TrendRangeDays) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="whitespace-nowrap">Khoảng thời gian</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as TrendRangeDays)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
      >
        {TREND_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
