import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Lightbulb, Sparkles, Target } from "lucide-react";
import type { ApplicationCandidateMatch } from "./types";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SignalChips } from "./SignalChips";

type ApplicationMatchInsightPanelProps = {
  candidateMatch?: ApplicationCandidateMatch | null;
  dataSourceLabel?: string;
};

export function ApplicationMatchInsightPanel({
  candidateMatch,
  dataSourceLabel = "Điểm hiện tại được lấy từ nguồn matching đang chọn.",
}: ApplicationMatchInsightPanelProps) {
  const title = candidateMatch?.candidateName ?? "Chưa chọn kết quả";
  const subtitle = candidateMatch?.jobTitle ?? "Chọn một dòng matching để xem lý do.";
  const score = candidateMatch?.score ?? null;
  const reason = candidateMatch?.reason ?? "";
  const matchedSignals = candidateMatch?.matchedSignals ?? [];
  const strengths = candidateMatch?.strengths ?? [];
  const relevantExperiences = candidateMatch?.relevantExperiences ?? [];
  const gaps = candidateMatch?.gaps ?? [];
  const actionSuggestion = candidateMatch?.actionSuggestion ?? "";

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

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Sparkles className="h-4 w-4 text-teal-600" />
          Vì sao phù hợp
        </div>
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
          {reason || "Chọn một kết quả để xem phân tích phù hợp."}
        </p>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Target className="h-4 w-4 text-teal-600" />
          Tín hiệu khớp
        </div>
        <SignalChips items={matchedSignals} />
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          Điểm mạnh
        </div>
        <SignalChips items={strengths} />
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <BriefcaseBusiness className="h-4 w-4 text-teal-600" />
          Kinh nghiệm liên quan
        </div>
        <SignalList items={relevantExperiences} />
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Cần kiểm tra thêm
        </div>
        <SignalChips items={gaps} tone="gap" />
      </section>

      {actionSuggestion ? (
        <section className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Lightbulb className="h-4 w-4 text-slate-600" />
            Gợi ý hành động
          </div>
          <p className="text-sm leading-6 text-slate-700">{actionSuggestion}</p>
        </section>
      ) : null}

      <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        {dataSourceLabel}
      </p>
    </aside>
  );
}

function SignalList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-xs text-slate-500">Chưa có kinh nghiệm đủ rõ để phân tích sâu.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
          {item}
        </li>
      ))}
    </ul>
  );
}
