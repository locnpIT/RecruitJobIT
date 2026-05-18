"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { adminService, type AdminCandidateProof } from "@/services/admin.service";
import { CandidateProofSummary } from "./components/CandidateProofSummary";
import { CandidateProofTable } from "./components/CandidateProofTable";
import { CandidateProofToolbar } from "./components/CandidateProofToolbar";

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

      <CandidateProofSummary total={summary.total} education={summary.education} certificate={summary.certificate} />

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <CandidateProofToolbar
          status={status}
          statusOptions={statusOptions}
          onStatusChange={setStatus}
          onReload={() => void loadData()}
        />

        <CandidateProofTable
          loading={loading}
          items={items}
          submittingId={submittingId}
          proofTypeLabel={proofTypeLabel}
          onApprove={(item) => void handleApprove(item)}
          onReject={(item) => void handleReject(item)}
        />
      </section>
    </>
  );
}
