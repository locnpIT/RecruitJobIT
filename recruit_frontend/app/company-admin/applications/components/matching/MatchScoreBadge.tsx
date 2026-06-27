type MatchScoreBadgeProps = {
  score: number;
};

function resolveScoreDisplay(score: number) {
  if (score >= 85) {
    return {
      label: "Rất phù hợp",
      tone: "border-teal-200 bg-teal-50 text-teal-700",
    };
  }

  if (score >= 75) {
    return {
      label: "Phù hợp",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 60) {
    return {
      label: "Có thể xem xét",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (score >= 40) {
    return {
      label: "Cân nhắc thấp",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (score >= 20) {
    return {
      label: "Mức khớp rất thấp",
      tone: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "Không phù hợp",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  };
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  const display = resolveScoreDisplay(score);

  return (
    <span
      className={`inline-flex min-w-28 flex-col items-center justify-center rounded-md border px-2.5 py-1 text-center text-xs font-semibold leading-tight ${display.tone}`}
    >
      <span>{score}%</span>
      <span className="font-medium">{display.label}</span>
    </span>
  );
}
