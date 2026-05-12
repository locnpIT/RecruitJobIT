"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { adminService, type AdminCandidateProof } from "@/services/admin.service";

const statusOptions = ["PENDING", "APPROVED", "REJECTED"];

const proofTypeLabel: Record<string, string> = {
  EDUCATION: "Học vấn",
  CERTIFICATE: "Chứng chỉ",
};

export default function CandidateProofsAdminPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<AdminCandidateProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listCandidateProofs({ status });
      setItems(data);
    } catch {
      toast.error("Không tải được danh sách minh chứng ứng viên.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total: items.length,
      education: items.filter((item) => item.loai === "EDUCATION").length,
      certificate: items.filter((item) => item.loai === "CERTIFICATE").length,
    }),
    [items],
  );

  const handleApprove = async (item: AdminCandidateProof) => {
    setSubmittingId(`${item.loai}-${item.id}`);
    try {
      await adminService.approveCandidateProof(item.loai, item.id);
      toast.success("Đã duyệt minh chứng ứng viên.");
      await loadData();
    } catch {
      toast.error("Duyệt minh chứng thất bại.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (item: AdminCandidateProof) => {
    const confirmed = window.confirm(`Từ chối minh chứng "${item.tieuDe ?? item.id}"?`);
    if (!confirmed) {
      return;
    }

    setSubmittingId(`${item.loai}-${item.id}`);
    try {
      await adminService.rejectCandidateProof(item.loai, item.id);
      toast.success("Đã từ chối minh chứng ứng viên.");
      await loadData();
    } catch {
      toast.error("Từ chối minh chứng thất bại.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Ứng viên"
        title="Duyệt Hồ Sơ Ứng Viên"
        subtitle="Rà soát minh chứng học vấn và chứng chỉ trước khi đánh dấu hợp lệ trong hồ sơ ứng viên."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label="Tổng minh chứng" value={summary.total} />
        <Stat label="Học vấn" value={summary.education} />
        <Stat label="Chứng chỉ" value={summary.certificate} />
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "PENDING" ? "Chờ duyệt" : option === "APPROVED" ? "Đã duyệt" : "Từ chối"}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadData()}
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Không có minh chứng phù hợp" description="Thử đổi trạng thái hoặc tải lại dữ liệu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-medium">Minh chứng</th>
                  <th className="pb-2 font-medium">Loại</th>
                  <th className="pb-2 font-medium">Ứng viên</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                  <th className="pb-2 font-medium">Tệp</th>
                  <th className="pb-2 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const rowKey = `${item.loai}-${item.id}`;
                  const isSubmitting = submittingId === rowKey;
                  return (
                    <tr key={rowKey} className="border-b border-slate-100 last:border-none">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{item.tieuDe ?? "--"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.moTa ?? `Hồ sơ #${item.hoSoUngVienId ?? "--"}`}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{proofTypeLabel[item.loai] ?? item.loai}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{item.ungVienHoTen ?? "--"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.ungVienEmail ?? "--"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill value={item.trangThai} />
                      </td>
                      <td className="py-3 pr-4">
                        {item.duongDanTep ? (
                          <a href={item.duongDanTep} target="_blank" rel="noreferrer" className="font-medium text-slate-700 underline">
                            Xem tệp
                          </a>
                        ) : (
                          <span className="text-slate-400">Không có tệp</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting || item.trangThai === "APPROVED"}
                            onClick={() => void handleApprove(item)}
                            className="rounded-md border border-emerald-300 px-2.5 py-1 font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting || item.trangThai === "REJECTED"}
                            onClick={() => void handleReject(item)}
                            className="rounded-md border border-rose-300 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
