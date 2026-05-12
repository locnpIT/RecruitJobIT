type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  delta?: string;
};

// Card thống kê nhỏ dùng trong dashboard admin.
// Nhận label/value/description để tái sử dụng cho nhiều loại metric khác nhau.
export function StatCard({ label, value, description, delta }: StatCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{description ?? ""}</p>
        {delta ? <span className="text-xs font-medium text-slate-700">{delta}</span> : null}
      </div>
    </article>
  );
}
