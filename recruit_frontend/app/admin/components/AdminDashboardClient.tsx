"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { SimpleChartCard } from "@/components/charts/SimpleChartCard";
import { TREND_RANGE_OPTIONS, type TrendRangeDays } from "@/components/charts/chartTimeSeries";
import { adminStatsService } from "@/services/admin/stats.service";
import type { AdminReport } from "@/services/admin/types";
import { StatsGrid } from "./StatsGrid";
import { StatusPill } from "./StatusPill";
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

type ReportRange = "7d" | "30d" | "90d";

const REPORT_RANGE_OPTIONS: Array<{ label: string; value: ReportRange }> = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "90 ngày", value: "90d" },
];

function buildTrendLabels(count: number): string[] {
  const labels: string[] = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    labels.push(day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
  }
  return labels;
}

export function AdminDashboardClient() {
  const dashboardData = useAdminDashboardData();
  const [trendRange, setTrendRange] = useState<TrendRangeDays>(7);
  const companyTrendChart = dashboardData.buildCompanyTrendChart(trendRange);

  const [reportRange, setReportRange] = useState<ReportRange>("7d");
  const [report, setReport] = useState<AdminReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadReport = useCallback(async (range: ReportRange) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await adminStatsService.getReport(range);
      setReport(data);
    } catch {
      setReportError("Không tải được dữ liệu báo cáo.");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(reportRange);
  }, [reportRange, loadReport]);

  const trendLabels = buildTrendLabels(report?.duLieuXuHuong.length ?? 7);

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

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <RecentCompaniesTable rows={dashboardData.recentCompanies} />
        <div className="space-y-4">
          <ActivityList items={dashboardData.systemActivity} />
          <QuickLinks />
        </div>
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

function RecentCompaniesTable({ rows }: { rows: Array<{ ten: string; congTy: string; trangThai: string; ngay: string }> }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Công ty gần đây</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Công ty</th>
                <th className="pb-2 pr-4">Chủ</th>
                <th className="pb-2 pr-4">Trạng thái</th>
                <th className="pb-2">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-b-0">
                  <td className="py-2 pr-4 font-medium text-slate-900">{row.ten}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.congTy}</td>
                  <td className="py-2 pr-4"><StatusPill value={row.trangThai} /></td>
                  <td className="py-2 text-slate-500">{row.ngay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function ActivityList({ items }: { items: string[] }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hoạt động hệ thống</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function QuickLinks() {
  const links = [
    { label: "Duyệt công ty", href: "/admin/companies", hint: "Xử lý doanh nghiệp đang chờ duyệt" },
    { label: "Duyệt tin tuyển dụng", href: "/admin/jobs", hint: "Rà soát tin mới được gửi" },
    { label: "Quản lý người dùng", href: "/admin/users", hint: "Xem và khoá tài khoản hệ thống" },
  ];

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Truy cập nhanh</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-sm bg-slate-900 text-center text-[10px] leading-4 text-white">→</span>
              <span>
                <span className="font-medium">{link.label}</span>
                <span className="ml-1.5 text-xs text-slate-500">{link.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
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
