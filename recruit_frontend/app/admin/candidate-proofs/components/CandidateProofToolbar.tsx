import { Button } from "@/components/ui/Button";

type CandidateProofToolbarProps = {
  status: string;
  statusOptions: string[];
  onStatusChange: (next: string) => void;
  onReload: () => void;
};

// Thanh filter + reload cho danh sách minh chứng.
export function CandidateProofToolbar({ status, statusOptions, onStatusChange, onReload }: CandidateProofToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option === "PENDING" ? "Chờ duyệt" : option === "APPROVED" ? "Đã duyệt" : "Từ chối"}
          </option>
        ))}
      </select>

      <Button variant="unstyled"
        type="button"
        onClick={onReload}
        className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Tải lại
      </Button>
    </div>
  );
}
