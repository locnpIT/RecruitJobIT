"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { adminService, type AdminReportResponse } from "@/services/admin.service";

/**
 * Trang báo cáo vận hành dành cho admin.
 * Dữ liệu hiện đi theo một tham số range đơn giản để frontend có thể thay đổi mốc thời gian
 * mà không cần quản lý state lọc quá phức tạp.
 */
export default function ReportsAdminPage() {
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AdminReportResponse | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        // Backend trả về toàn bộ payload báo cáo theo range đã chọn.
        const data = await adminService.getReports({ range });
        setReport(data);
      } catch (error) {
        console.error(error);
        toast.error("Không tải được báo cáo hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [range]);

  return (
    <>
      <PageHeader
        eyebrow="Giám sát"
        title="Báo Cáo Hệ Thống"
        subtitle="Theo dõi các chỉ số vận hành và hiệu quả duyệt nội dung theo từng giai đoạn."
        actions={
          <select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            <option value="7d">7 ngày gần nhất</option>
            <option value="30d">30 ngày gần nhất</option>
            <option value="90d">90 ngày gần nhất</option>
          </select>
        }
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(report?.metrics ?? []).map((item) => (
          <article key={item.label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.note}</p>
          </article>
        ))}
        {!loading && (report?.metrics?.length ?? 0) === 0 && (
          <article className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Chưa có dữ liệu báo cáo trong giai đoạn này.
          </article>
        )}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Xu hướng hoạt động tuyển dụng</h2>
          <div className="mt-4 flex h-52 items-end gap-2">
            {/* Dùng cột đơn giản để mô phỏng chart, dễ thay bằng thư viện chart thật sau này. */}
            {(report?.trendData ?? []).map((value, index) => (
              <div key={index} className="flex-1 rounded-t bg-blue-200" style={{ height: `${value * 6}px` }} />
            ))}
          </div>
          {!loading && (report?.trendData?.length ?? 0) === 0 && (
            <p className="mt-2 text-xs text-slate-500">Chưa có dữ liệu xu hướng.</p>
          )}
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Trạng thái hệ thống</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex justify-between"><span>API uptime</span><b>{report?.systemStatus.apiUptime ?? "--"}</b></li>
            <li className="flex justify-between"><span>Độ trễ trung bình</span><b>{report?.systemStatus.averageLatency ?? "--"}</b></li>
            <li className="flex justify-between"><span>Tác vụ duyệt chờ xử lý</span><b>{report?.systemStatus.pendingReviewTasks ?? 0}</b></li>
            <li className="flex justify-between"><span>Sự cố mở</span><b>{report?.systemStatus.openIncidents ?? 0}</b></li>
          </ul>
        </article>
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Top công ty hoạt động</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Công ty</th>
                <th className="pb-2 font-medium">Tin đang mở</th>
                <th className="pb-2 font-medium">Đơn ứng tuyển</th>
              </tr>
            </thead>
            <tbody>
              {(report?.topCompanies ?? []).map((row) => (
                <tr key={row.name} className="border-b border-slate-100 last:border-none">
                  <td className="py-2.5 font-medium text-slate-900">{row.name}</td>
                  <td className="py-2.5 text-slate-700">{row.jobs}</td>
                  <td className="py-2.5 text-slate-700">{row.applications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (report?.topCompanies?.length ?? 0) === 0 && (
          <p className="mt-2 text-xs text-slate-500">Chưa có dữ liệu top công ty.</p>
        )}
      </section>
    </>
  );
}
