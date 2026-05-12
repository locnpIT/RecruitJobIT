import type { CompanyPackageRegistration } from "@/services/company-admin.service";
import { formatDateTime } from "./package-format";

// Section hiển thị gói hiện tại của công ty.
// Được dùng để cho owner biết trạng thái hiệu lực và thanh toán ngay trên đầu màn packages.
type CurrentPlanSectionProps = {
  currentPlan: CompanyPackageRegistration | null;
};

export function CurrentPlanSection({ currentPlan }: CurrentPlanSectionProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Gói hiện tại</p>
      <div className="mt-3 text-sm text-slate-700">
        {currentPlan ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{currentPlan.tenGoi ?? "--"}</p>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-medium ${
                  currentPlan.coHieuLuc
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                {currentPlan.coHieuLuc ? "Đang hoạt động" : "Đã hết hạn"}
              </span>
              <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                {currentPlan.trangThaiThanhToan ?? "--"}
              </span>
            </div>
            <p className="mt-2 text-slate-600">Hiệu lực đến: {formatDateTime(currentPlan.hetHanLuc)}</p>
          </>
        ) : (
          <p className="text-slate-600">Chưa có gói hoạt động.</p>
        )}
      </div>
    </section>
  );
}
