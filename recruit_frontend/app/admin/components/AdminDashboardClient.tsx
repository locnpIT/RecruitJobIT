"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { SimpleChartCard } from "@/components/charts/SimpleChartCard";
import { TREND_RANGE_OPTIONS, type TrendRangeDays } from "@/components/charts/chartTimeSeries";
import type { AdminReport } from "@/services/admin/types";
import { StatsGrid } from "./StatsGrid";
import { StatusPill } from "./StatusPill";
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";
import { useAdminReportData, REPORT_RANGE_OPTIONS } from "../hooks/useAdminReportData";

export function AdminDashboardClient() {
  const dashboardData = useAdminDashboardData();
  const [trendRange, setTrendRange] = useState<TrendRangeDays>(7);
  const companyTrendChart = dashboardData.buildCompanyTrendChart(trendRange);

  const { reportRange, setReportRange, report, reportLoading, reportError, trendLabels } =
    useAdminReportData();

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
        />
        <SimpleChartCard
          title="Trạng thái người dùng"
          description="Phân bố tài khoản đang hoạt động và bị khóa."
          kind="bar"
          labels={dashboardData.userChart.labels}
          values={dashboardData.userChart.values}
          colors={dashboardData.userChart.colors}
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
          headerRight={<SelectRange value={trendRange} onChange={setTrendRange} />}
        />
      </section>

      {/* Phần báo cáo chi tiết */}
      <section className="mt-8 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Báo cáo chi tiết</h2>
            <p className="text-xs text-slate-500">Số liệu tổng hợp theo khoảng thời gian.</p>
          </div>
          <div className="flex items-center gap-2">
            {REPORT_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReportRange(opt.value)}
                className={`h-8 rounded-md border px-3 text-sm font-medium transition ${
                  reportRange === opt.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {reportLoading ? (
          <div className="flex min-h-[120px] items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải báo cáo...
          </div>
        ) : reportError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{reportError}</div>
        ) : report ? (
          <div className="space-y-4 pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {report.chiSo.map((metric) => (
                <article key={metric.label} className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{metric.value}</p>
                  {metric.ghiChu ? <p className="mt-1 text-xs text-slate-400">{metric.ghiChu}</p> : null}
                </article>
              ))}
            </div>

            <SimpleChartCard
              title="Xu hướng tin tuyển dụng theo ngày"
              description="Số tin tuyển dụng được tạo mới trong khoảng thời gian đang chọn (hiển thị 7 ngày cuối)."
              kind="line"
              labels={trendLabels}
              values={report.duLieuXuHuong}
              colors={["#008080"]}
              heightClassName="h-64"
            />

            <TopCompaniesTable rows={report.topCongTy} />
          </div>
        ) : null}
      </section>
    </>
  );
}

// --- Private sub-components ---

function SelectRange({ value, onChange }: { value: TrendRangeDays; onChange: (v: TrendRangeDays) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="whitespace-nowrap">Khoảng thời gian</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as TrendRangeDays)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
      >
        {TREND_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function TopCompaniesTable({ rows }: { rows: AdminReport["topCongTy"] }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Top 5 công ty hoạt động</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-6">#</th>
                <th className="pb-2 pr-6">Công ty</th>
                <th className="pb-2 pr-6 text-right">Số tin</th>
                <th className="pb-2 text-right">Số đơn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.ten} className="border-b border-slate-50 last:border-b-0">
                  <td className="py-2 pr-6 text-slate-400">{i + 1}</td>
                  <td className="py-2 pr-6 font-medium text-slate-900">{row.ten}</td>
                  <td className="py-2 pr-6 text-right text-slate-700">{row.soTin}</td>
                  <td className="py-2 text-right text-slate-700">{row.soDon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
