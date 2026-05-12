// Header đơn giản cho màn quản lý job của công ty.
// Tách riêng để page container giữ tập trung vào state và nghiệp vụ.
export function JobsHeader() {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Tin tuyển dụng</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Quản lý tin tuyển dụng theo chi nhánh</h1>
    </div>
  );
}
