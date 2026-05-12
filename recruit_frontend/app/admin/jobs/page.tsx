"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { adminService, type AdminJob, type AdminJobDetail } from "@/services/admin.service";

// Màn /admin/jobs.
// Chịu trách nhiệm render danh sách duyệt tin tuyển dụng, filter, xem chi tiết và thao tác approve/reject/hide.
export default function JobsAdminPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<AdminJobDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectingJob, setRejectingJob] = useState<AdminJob | null>(null);
  const [hidingJob, setHidingJob] = useState<AdminJob | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filters = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      company: company.trim() || undefined,
      status: status || undefined,
      industry: industry.trim() || undefined,
      location: location.trim() || undefined,
    }),
    [keyword, company, status, industry, location],
  );

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listJobs(filters);
      setJobs(data);
    } catch (err) {
      setError("Không tải được danh sách tin tuyển dụng.");
      setJobs([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const formatSalary = (job: AdminJob) => {
    if (job.luongToiThieu == null && job.luongToiDa == null) return "Thoả thuận";
    const toVnd = (value: number | null) =>
      value == null ? "" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
    if (job.luongToiThieu != null && job.luongToiDa != null) {
      return `${toVnd(job.luongToiThieu)} - ${toVnd(job.luongToiDa)}`;
    }
    return toVnd(job.luongToiThieu ?? job.luongToiDa);
  };

  const handleViewDetail = async (jobId: number) => {
    try {
      const data = await adminService.getJobDetail(jobId);
      setDetail(data);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      alert("Không tải được chi tiết tin.");
    }
  };

  const handleApprove = async (jobId: number) => {
    setSubmitting(true);
    try {
      await adminService.approveJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Duyệt tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingJob || !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.rejectJob(rejectingJob.id, { lyDoTuChoi: rejectReason.trim() });
      setRejectingJob(null);
      setRejectReason("");
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Từ chối tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async () => {
    if (!hidingJob) return;
    setSubmitting(true);
    try {
      await adminService.hideJob(hidingJob.id);
      setHidingJob(null);
      await loadJobs();
    } catch (err) {
      console.error(err);
      alert("Ẩn tin thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Tuyển dụng"
        title="Duyệt Tin Tuyển Dụng"
        subtitle="Rà soát nội dung tin và kiểm soát trạng thái hiển thị trước khi phát hành cho ứng viên."
      />

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 grid gap-2 md:grid-cols-5">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm tiêu đề"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Lọc theo công ty"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lọc theo địa điểm"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Lọc theo ngành nghề"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="HIDDEN">Đã ẩn</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>

        {loading ? (
          <p className="py-6 text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="py-6 text-sm text-rose-600">{error}</p>
        ) : jobs.length === 0 ? (
          <EmptyState title="Không có tin phù hợp" description="Điều chỉnh bộ lọc để tìm lại danh sách tin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-medium">Tin tuyển dụng</th>
                  <th className="pb-2 font-medium">Công ty</th>
                  <th className="pb-2 font-medium">Địa điểm</th>
                  <th className="pb-2 font-medium">Mức lương</th>
                  <th className="pb-2 font-medium">Kinh nghiệm</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                  <th className="pb-2 font-medium">Ngày tạo</th>
                  <th className="pb-2 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-none">
                    <td className="py-2.5">
                      <p className="font-medium text-slate-900">{job.tieuDe ?? "(Không có tiêu đề)"}</p>
                      <p className="text-xs text-slate-500">#{job.id}</p>
                    </td>
                    <td className="py-2.5 text-slate-700">{job.congTyTen ?? "-"}</td>
                    <td className="py-2.5 text-slate-700">{job.diaDiem ?? "-"}</td>
                    <td className="py-2.5 text-slate-700">{formatSalary(job)}</td>
                    <td className="py-2.5 text-slate-700">{job.capDoKinhNghiemTen ?? "-"}</td>
                    <td className="py-2.5"><StatusPill value={job.trangThai} /></td>
                    <td className="py-2.5 text-slate-500">{job.ngayTao ? new Date(job.ngayTao).toLocaleDateString("vi-VN") : "-"}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleViewDetail(job.id)} className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50">Chi tiết</button>
                        <button type="button" disabled={submitting || job.trangThai === "APPROVED"} onClick={() => void handleApprove(job.id)} className="rounded-md border border-emerald-300 px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">Duyệt</button>
                        <button type="button" disabled={submitting} onClick={() => setRejectingJob(job)} className="rounded-md border border-rose-300 px-2.5 py-1 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">Từ chối</button>
                        <button type="button" disabled={submitting || job.trangThai === "HIDDEN"} onClick={() => setHidingJob(job)} className="rounded-md border border-violet-300 px-2.5 py-1 text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">Ẩn tin</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailOpen && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{detail.summary.tieuDe ?? "Chi tiết tin"}</h3>
                <p className="mt-1 text-sm text-slate-500">{detail.summary.congTyTen ?? "-"} • {detail.summary.diaDiem ?? "-"}</p>
              </div>
              <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600" onClick={() => setDetailOpen(false)}>Đóng</button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Mô tả</p>
                <p className="whitespace-pre-wrap">{detail.moTa || "-"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Yêu cầu</p>
                <p className="whitespace-pre-wrap">{detail.yeuCau || "-"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Phúc lợi</p>
                <p className="whitespace-pre-wrap">{detail.phucLoi || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {Boolean(rejectingJob) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Từ chối tin tuyển dụng</h3>
            <p className="mt-2 text-sm text-slate-600">Nhập lý do từ chối cho tin &quot;{rejectingJob?.tieuDe ?? ""}&quot;.</p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ví dụ: Nội dung chưa rõ ràng, thiếu quyền lợi..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setRejectingJob(null);
                  setRejectReason("");
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleReject()}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(hidingJob)}
        title="Ẩn tin tuyển dụng"
        description={`Xác nhận ẩn tin "${hidingJob?.tieuDe ?? ""}" khỏi danh sách hiển thị.`}
        tone="danger"
        confirmLabel="Xác nhận ẩn"
        isLoading={submitting}
        onCancel={() => setHidingJob(null)}
        onConfirm={() => void handleHide()}
      />
    </>
  );
}
