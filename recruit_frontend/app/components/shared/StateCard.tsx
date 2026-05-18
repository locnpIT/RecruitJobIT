type StateCardTone = "default" | "muted" | "error";

type StateCardProps = {
  message: string;
  tone?: StateCardTone;
  paddingClassName?: string;
  className?: string;
};

const TONE_CLASS_MAP: Record<StateCardTone, string> = {
  default: "border-slate-200 bg-white text-slate-500",
  muted: "border-slate-200 bg-slate-50 text-slate-500",
  error: "border-red-200 bg-red-50 text-red-700",
};

// Card trạng thái dùng chung cho loading/empty/error ở các màn hình.
// Mục tiêu: giảm lặp class Tailwind và giữ visual nhất quán toàn site.
export function StateCard({
  message,
  tone = "default",
  paddingClassName = "p-4",
  className = "",
}: StateCardProps) {
  return (
    <div className={`rounded-lg border text-sm ${TONE_CLASS_MAP[tone]} ${paddingClassName} ${className}`.trim()}>
      {message}
    </div>
  );
}

