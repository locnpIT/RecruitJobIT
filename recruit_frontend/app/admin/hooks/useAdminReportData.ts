"use client";

import { useCallback, useEffect, useState } from "react";
import { adminStatsService } from "@/services/admin/stats.service";
import type { AdminReport } from "@/services/admin/types";

export type ReportRange = "7d" | "30d" | "90d";

export const REPORT_RANGE_OPTIONS: Array<{ label: string; value: ReportRange }> = [
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

// Quản lý range selector, fetch báo cáo chi tiết và labels cho trend chart.
export function useAdminReportData() {
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

  return {
    reportRange,
    setReportRange,
    report,
    reportLoading,
    reportError,
    trendLabels,
  };
}
