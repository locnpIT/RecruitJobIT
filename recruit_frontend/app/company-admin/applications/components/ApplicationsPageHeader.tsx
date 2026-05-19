// Header phần đơn ứng tuyển của company-admin.
export function ApplicationsPageHeader() {
  return (
    <header className="border-b border-slate-200 pb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ứng viên</p>
      <h1 className="mt-2 text-2xl font-semibold">Đơn ứng tuyển theo chi nhánh</h1>
      <p className="mt-2 text-sm text-slate-600">
        Xem hồ sơ ứng viên, tải CV và cập nhật trạng thái xử lý đơn trong phạm vi chi nhánh được phân quyền.
      </p>
    </header>
  );
}
