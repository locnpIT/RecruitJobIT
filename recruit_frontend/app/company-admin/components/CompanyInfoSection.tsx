type CompanyInfoSectionProps = {
  email: string | null;
  maSoThue: string | null;
  website: string | null;
  canPostJobs: boolean;
  goiDangBaiTen: string | null;
  goiDangBaiHetHanLuc: string | null;
  logoUrl: string | null;
};

export function CompanyInfoSection({
  email,
  maSoThue,
  website,
  canPostJobs,
  goiDangBaiTen,
  goiDangBaiHetHanLuc,
  logoUrl,
}: CompanyInfoSectionProps) {
  const goiValue = canPostJobs
    ? `${goiDangBaiTen ?? "Đang hoạt động"}${
        goiDangBaiHetHanLuc
          ? `, hết hạn ${new Date(goiDangBaiHetHanLuc).toLocaleString("vi-VN")}`
          : ""
      }`
    : "Chưa có gói hoạt động";

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Thông tin chung
        </h2>
        <dl className="divide-y divide-slate-200 text-sm">
          <LineRow label="Tài khoản" value={email ?? "--"} />
          <LineRow label="Mã số thuế" value={maSoThue ?? "--"} />
          <LineRow label="Website" value={website ?? "--"} />
          <LineRow label="Gói đăng bài" value={goiValue} />
          <LineRow label="Logo" value={logoUrl ? "Đã có" : "Chưa có"} />
        </dl>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Logo
        </h2>
        <div className="pt-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo công ty"
              className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50 object-contain p-1"
            />
          ) : (
            <div className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50" />
          )}
          <p className="mt-2 text-sm text-slate-600">{logoUrl ? "Đã cập nhật" : "Chưa có logo"}</p>
        </div>
      </div>
    </section>
  );
}

function LineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
