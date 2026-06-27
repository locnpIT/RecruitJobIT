"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/PageHeader";
import { CandidateProofSummary } from "./CandidateProofSummary";
import { CandidateProofTable } from "./CandidateProofTable";
import { CandidateProofToolbar } from "./CandidateProofToolbar";
import { useAdminCandidateProofsActions } from "../hooks/useAdminCandidateProofsActions";
import { useAdminCandidateProofsData } from "../hooks/useAdminCandidateProofsData";
import { Button } from "@/components/ui/Button";

const statusOptions = ["PENDING", "APPROVED", "REJECTED"];

const proofTypeLabel: Record<string, string> = {
  EDUCATION: "Học vấn",
  CERTIFICATE: "Chứng chỉ",
};

// Client container cho trang /admin/candidate-proofs.
export function CandidateProofsAdminClient() {
  const data = useAdminCandidateProofsData();
  const actions = useAdminCandidateProofsActions({ onReload: data.loadData });
  const { mutationError, mutationSuccess, setMutationError, setMutationSuccess } = actions;
  const [selectedProofKeys, setSelectedProofKeys] = useState<string[]>([]);

  const approvableProofs = useMemo(
    () => data.items.filter((item) => item.trangThai !== "APPROVED"),
    [data.items],
  );

  const selectedProofs = useMemo(
    () => approvableProofs.filter((item) => selectedProofKeys.includes(`${item.loai}-${item.id}`)),
    [approvableProofs, selectedProofKeys],
  );

  const handleToggleProof = (proofKey: string, checked: boolean) => {
    setSelectedProofKeys((current) =>
      checked ? Array.from(new Set([...current, proofKey])) : current.filter((key) => key !== proofKey),
    );
  };

  const handleToggleAllProofs = (checked: boolean) => {
    setSelectedProofKeys(checked ? approvableProofs.map((item) => `${item.loai}-${item.id}`) : []);
  };

  useEffect(() => {
    if (data.error) {
      toast.error(data.error);
    }
  }, [data.error]);

  useEffect(() => {
    if (mutationError) {
      toast.error(mutationError);
      setMutationError(null);
    }
  }, [mutationError, setMutationError]);

  useEffect(() => {
    if (mutationSuccess) {
      toast.success(mutationSuccess);
      setMutationSuccess(null);
    }
  }, [mutationSuccess, setMutationSuccess]);

  return (
    <>
      <PageHeader
        eyebrow="Ứng viên"
        title="Duyệt Hồ Sơ Ứng Viên"
        subtitle="Rà soát minh chứng học vấn và chứng chỉ trước khi đánh dấu hợp lệ trong hồ sơ ứng viên."
      />

      <CandidateProofSummary
        total={data.summary.total}
        education={data.summary.education}
        certificate={data.summary.certificate}
      />

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <CandidateProofToolbar
          status={data.status}
          statusOptions={statusOptions}
          onStatusChange={data.setStatus}
          onReload={() => void data.loadData()}
        />

        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm text-slate-600">Đã chọn {selectedProofs.length} minh chứng có thể duyệt.</p>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={Boolean(actions.submittingId) || selectedProofs.length === 0}
            onClick={() => void actions.handleBulkApprove(selectedProofs).then((success) => {
              if (success) setSelectedProofKeys([]);
            })}
          >
            {actions.submittingId ? "Đang xử lý..." : "Duyệt đã chọn"}
          </Button>
        </div>

        <CandidateProofTable
          loading={data.loading}
          items={data.items}
          submittingId={actions.submittingId}
          proofTypeLabel={proofTypeLabel}
          selectedProofKeys={selectedProofs.map((item) => `${item.loai}-${item.id}`)}
          allSelectableChecked={approvableProofs.length > 0 && selectedProofs.length === approvableProofs.length}
          hasSelectableProofs={approvableProofs.length > 0}
          onToggleProof={handleToggleProof}
          onToggleAllProofs={handleToggleAllProofs}
          onApprove={(item) => void actions.handleApprove(item)}
          onReject={(item) => {
            const confirmed = window.confirm(`Từ chối minh chứng "${item.tieuDe ?? item.id}"?`);
            if (!confirmed) {
              return;
            }
            void actions.handleReject(item);
          }}
        />
      </section>
    </>
  );
}
