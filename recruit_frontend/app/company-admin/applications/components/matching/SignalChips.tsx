type SignalChipsProps = {
  items: string[];
  tone?: "match" | "gap";
};

export function SignalChips({ items, tone = "match" }: SignalChipsProps) {
  const className =
    tone === "match"
      ? "bg-slate-100 text-slate-700"
      : "border border-amber-200 bg-amber-50 text-amber-700";

  if (!items.length) {
    return <p className="text-xs text-slate-500">Chưa có dữ liệu rõ ràng.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2 py-1 text-[11px] font-medium ${className}`}>
          {item}
        </span>
      ))}
    </div>
  );
}
