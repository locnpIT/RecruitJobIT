type PackageStatsCardsProps = {
  totalPackages: number;
  inUseCount: number;
};

// Nhóm card thống kê nhanh cho màn /admin/plans.
// Mục đích là cho admin thấy ngay quy mô danh mục gói và mức độ sử dụng hiện tại.
export function PackageStatsCards({ totalPackages, inUseCount }: PackageStatsCardsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tổng gói</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{totalPackages}</p>
      </article>
      <article className="border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Đang được dùng</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{inUseCount}</p>
      </article>
      <article className="border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trạng thái</p>
        <p className="mt-2 text-sm text-slate-700">Quản lý trực tiếp từ admin hệ thống</p>
      </article>
    </section>
  );
}
