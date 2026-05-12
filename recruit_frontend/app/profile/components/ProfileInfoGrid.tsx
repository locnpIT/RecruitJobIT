export function ProfileInfoGrid({
  fullName,
  email,
  role,
  status,
}: {
  fullName: string;
  email: string;
  role: string;
  status: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Info label="Họ và tên" value={fullName} />
      <Info label="Email" value={email} />
      <Info label="Vai trò" value={role} />
      <Info label="Trạng thái" value={status} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
