import Link from "next/link";

// Danh sách tác vụ nhanh trên dashboard admin.
// Mỗi item là một lối tắt đến workflow vận hành hay dùng.
type QuickAction = {
  label: string;
  href: string;
  hint: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Tác vụ nhanh</h2>
      <div className="mt-3 space-y-2">
        {actions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md border border-slate-200 px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
          >
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
