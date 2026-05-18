type BranchesPageHeaderProps = {
  title: string;
};

// Header dùng chung cho trang chi nhánh, giữ style nhất quán kể cả khi công ty chưa được duyệt.
export function BranchesPageHeader({ title }: BranchesPageHeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Chi nhánh</p>
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
    </header>
  );
}
