"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SimpleChartCard } from "@/components/charts/SimpleChartCard";
import { buildDailyTrendChart, TREND_RANGE_OPTIONS, type TrendRangeDays } from "@/components/charts/chartTimeSeries";
import { CompanyAdminRestrictedNotice } from "./CompanyAdminRestrictedNotice";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { BranchSummaryTable } from "./BranchSummaryTable";
import { useCompanyAdminHomeData } from "../hooks/useCompanyAdminHomeData";

// Client container cho trang /company-admin.
export function CompanyAdminHomeClient() {
  const data = useCompanyAdminHomeData();
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");
  const [selectedRangeDays, setSelectedRangeDays] = useState<TrendRangeDays>(7);

  const filteredBranch = useMemo(() => {
    if (selectedBranchId === "all") {
      return null;
    }

    return data.branchSummary.find((item) => item.branchId === selectedBranchId) ?? null;
  }, [data.branchSummary, selectedBranchId]);

  const selectedJobs = useMemo(() => {
    const jobs = filteredBranch?.jobs ?? data.branchSummary.flatMap((item) => item.jobs);
    return filterByDays(jobs, selectedRangeDays);
  }, [data.branchSummary, filteredBranch?.jobs, selectedRangeDays]);

  const selectedApplications = useMemo(() => {
    const applications = filteredBranch?.applications ?? data.branchSummary.flatMap((item) => item.applications);
    return filterByDays(applications, selectedRangeDays);
  }, [data.branchSummary, filteredBranch?.applications, selectedRangeDays]);

  const selectedJobsCount = selectedJobs.length;
  const selectedApplicationsCount = selectedApplications.length;

  const jobTrendChart = useMemo(
    () => buildDailyTrendChart(selectedJobs.map((j) => j.ngayTao ?? null), selectedRangeDays),
    [selectedJobs, selectedRangeDays],
  );
  const applicationTrendChart = useMemo(
    () => buildDailyTrendChart(selectedApplications.map((a) => a.ngayTao ?? null), selectedRangeDays),
    [selectedApplications, selectedRangeDays],
  );

  const jobStatusChart = buildStatusChart(
    selectedJobs.map((job) => job.trangThai),
    ["APPROVED", "PENDING", "REJECTED"],
    ["Đã duyệt", "Chờ duyệt", "Bị từ chối"],
    ["#008080", "#f59e0b", "#ef4444"],
  );
  const applicationStatusChart = buildStatusChart(
    selectedApplications.map((application) => application.trangThai),
    ["PENDING", "APPROVED", "REJECTED"],
    ["Chờ xử lý", "Đã duyệt", "Bị từ chối"],
    ["#0f766e", "#2563eb", "#ef4444"],
  );

  if (data.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (data.error || !data.data) {
    return (
      <div className="border border-rose-200 px-4 py-3 text-rose-700">
        {data.error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <header className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company Admin</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.data.congTy.ten ?? "Công ty chưa có tên"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.data.congTy.trangThai ?? "--"} · {data.branchCount} chi nhánh · chi nhánh chính: {data.primaryBranch?.chiNhanhTen ?? "--"}
        </p>
      </header>

      {!data.companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={data.companyRejected ? "Công ty đã bị từ chối" : "Công ty đang chờ duyệt"}
          tone={data.companyRejected ? "danger" : "success"}
          description={
            data.companyRejected
              ? `Lý do từ chối: ${data.data.congTy.lyDoTuChoi ?? "Chưa có lý do"}. Bạn có thể vào mục Tuỳ chỉnh để cập nhật logo và gửi duyệt lại.`
              : "Công ty đang chờ duyệt. Hiện chỉ có thể cập nhật logo ở mục Tuỳ chỉnh."
          }
        />
      ) : null}

      <CompanyInfoSection
        email={data.data.nguoiDung.email}
        maSoThue={data.data.congTy.maSoThue}
        website={data.data.congTy.website}
        canPostJobs={data.companyCanPostJobs}
        goiDangBaiTen={data.data.congTy.goiDangBaiTen}
        goiDangBaiHetHanLuc={data.data.congTy.goiDangBaiHetHanLuc}
        logoUrl={data.companyLogo}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimpleChartCard
          title="Tin tuyển dụng"
          description="Số lượng và trạng thái tin tuyển dụng theo chi nhánh đang chọn."
          kind="doughnut"
          labels={jobStatusChart.labels}
          values={jobStatusChart.values}
          colors={jobStatusChart.colors}
          headerRight={
            <div className="flex flex-wrap items-center gap-2">
              <BranchSelect branches={data.visibleBranches} value={selectedBranchId} onChange={setSelectedBranchId} />
              <RangeSelect value={selectedRangeDays} onChange={setSelectedRangeDays} />
            </div>
          }
          footer={`${selectedJobsCount} tin tuyển dụng trong ${selectedRangeDays} ngày gần nhất.`}
        />
        <SimpleChartCard
          title="Đơn ứng tuyển"
          description="Trạng thái đơn ứng tuyển theo chi nhánh đang chọn."
          kind="bar"
          labels={applicationStatusChart.labels}
          values={applicationStatusChart.values}
          colors={applicationStatusChart.colors}
          footer={`${selectedApplicationsCount} đơn ứng tuyển trong ${selectedRangeDays} ngày gần nhất.`}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimpleChartCard
          title="Xu hướng tin tuyển dụng theo ngày"
          description="Số tin mới được tạo mỗi ngày trong khoảng thời gian đang chọn."
          kind="line"
          labels={jobTrendChart.labels}
          values={jobTrendChart.values}
          colors={jobTrendChart.colors}
          heightClassName="h-60"
          footer={`${selectedJobsCount} tin trong ${selectedRangeDays} ngày.`}
        />
        <SimpleChartCard
          title="Xu hướng đơn ứng tuyển theo ngày"
          description="Số đơn nộp mới mỗi ngày trong khoảng thời gian đang chọn."
          kind="line"
          labels={applicationTrendChart.labels}
          values={applicationTrendChart.values}
          colors={["#2563eb"]}
          heightClassName="h-60"
          footer={`${selectedApplicationsCount} đơn trong ${selectedRangeDays} ngày.`}
        />
      </section>

      <BranchSummaryTable branches={data.visibleBranches} />
    </div>
  );
}

function BranchSelect({
  branches,
  value,
  onChange,
}: {
  branches: Array<{ chiNhanhId?: number | null; chiNhanhTen?: string | null }>;
  value: number | "all";
  onChange: (value: number | "all") => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="whitespace-nowrap">Chi nhánh</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value === "all" ? "all" : Number(event.target.value))}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
      >
        <option value="all">Tất cả</option>
        {branches.map((branch) => (
          <option key={branch.chiNhanhId ?? branch.chiNhanhTen} value={branch.chiNhanhId ?? ""}>
            {branch.chiNhanhTen ?? "--"}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeSelect({
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

function buildStatusChart(
  statuses: Array<string | null>,
  expectedStatuses: string[],
  labels: string[],
  colors: string[],
) {
  const values = expectedStatuses.map((status) => statuses.filter((item) => item?.toUpperCase() === status).length);
  return { labels, values, colors };
}

function filterByDays<T extends { ngayTao?: string | null }>(items: T[], spanDays: TrendRangeDays) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (spanDays - 1));

  return items.filter((item) => {
    if (!item.ngayTao) {
      return false;
    }

    const createdAt = new Date(item.ngayTao);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoff;
  });
}
