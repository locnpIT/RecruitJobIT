"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/PageHeader";
import { CandidateProofSummary } from "./CandidateProofSummary";
import { CandidateProofTable } from "./CandidateProofTable";
import { CandidateProofToolbar } from "./CandidateProofToolbar";
import { useAdminCandidateProofsActions } from "../hooks/useAdminCandidateProofsActions";
import { useAdminCandidateProofsData } from "../hooks/useAdminCandidateProofsData";

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

        <CandidateProofTable
          loading={data.loading}
          items={data.items}
          submittingId={actions.submittingId}
          proofTypeLabel={proofTypeLabel}
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
