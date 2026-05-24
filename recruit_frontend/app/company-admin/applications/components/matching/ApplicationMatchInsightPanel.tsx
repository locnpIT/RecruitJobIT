import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import type { ApplicationCandidateMatch, ApplicationJobMatch } from "./types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SignalChips } from "./SignalChips";

type ApplicationMatchInsightPanelProps = {
  candidateMatch?: ApplicationCandidateMatch | null;
  jobMatch?: ApplicationJobMatch | null;
  dataSourceLabel?: string;
};

export function ApplicationMatchInsightPanel({
  candidateMatch,
  jobMatch,
  dataSourceLabel = "Điểm hiện tại dùng dữ liệu preview từ đơn ứng tuyển khi Qdrant chưa trả kết quả.",
}: ApplicationMatchInsightPanelProps) {
  const title = candidateMatch?.candidateName ?? jobMatch?.jobTitle ?? "Chưa chọn kết quả";
  const subtitle = candidateMatch?.jobTitle ?? jobMatch?.candidateName ?? "Chọn một dòng matching để xem lý do.";
  const score = candidateMatch?.score ?? jobMatch?.score ?? null;
  const reason = candidateMatch?.reason ?? jobMatch?.reason ?? "";
  const matchedSignals = candidateMatch?.matchedSignals ?? jobMatch?.matchedSignals ?? [];
  const gaps = candidateMatch?.gaps ?? jobMatch?.gaps ?? [];

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lý do gợi ý</p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {score == null ? null : <MatchScoreBadge score={score} />}
      </div>

      {reason ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <p className="text-sm leading-6 text-slate-700">{reason}</p>
          </div>
        </div>
      ) : null}

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          Tín hiệu khớp
        </div>
        <SignalChips items={matchedSignals} />
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Cần kiểm tra thêm
        </div>
        <SignalChips items={gaps} tone="gap" />
      </section>

      <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        {dataSourceLabel}
      </p>
    </aside>
  );
}
