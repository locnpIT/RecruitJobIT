import { StatCard } from "../../components/StatCard";

type CandidateProofSummaryProps = {
  total: number;
  education: number;
  certificate: number;
};

// Khối số liệu nhanh cho trang duyệt minh chứng ứng viên.
export function CandidateProofSummary({ total, education, certificate }: CandidateProofSummaryProps) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatCard label="Tổng minh chứng" value={String(total)} />
      <StatCard label="Học vấn" value={String(education)} />
      <StatCard label="Chứng chỉ" value={String(certificate)} />
    </section>
  );
}
