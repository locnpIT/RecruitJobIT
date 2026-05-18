type SettingsPageHeaderProps = {
  companyName: string;
};

// Header chuẩn cho màn cấu hình công ty.
export function SettingsPageHeader({ companyName }: SettingsPageHeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tuỳ chỉnh</p>
      <h1 className="mt-2 text-2xl font-semibold">{companyName}</h1>
      <p className="mt-2 text-sm text-slate-600">Cập nhật thông tin công ty, logo và gửi duyệt lại khi cần.</p>
    </header>
  );
}
