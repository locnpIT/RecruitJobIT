type MatchScoreBadgeProps = {
  score: number;
};

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  const tone =
    score >= 85
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : score >= 75
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {score}%
    </span>
  );
}
