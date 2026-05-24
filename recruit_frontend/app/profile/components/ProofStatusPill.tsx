const proofStatusLabel: Record<string, string> = {
  PENDING: "Chờ admin duyệt",
  APPROVED: "Đã xác minh",
  REJECTED: "Minh chứng bị từ chối",
  UNVERIFIED: "Chưa xác minh",
};

const proofStatusClass: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
  UNVERIFIED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function ProofStatusPill({ value }: { value: string | null }) {
  const normalized = (value ?? "UNVERIFIED").toUpperCase();
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
        proofStatusClass[normalized] ?? proofStatusClass.UNVERIFIED
      }`}
    >
      {proofStatusLabel[normalized] ?? "Chưa xác minh"}
    </span>
  );
}

