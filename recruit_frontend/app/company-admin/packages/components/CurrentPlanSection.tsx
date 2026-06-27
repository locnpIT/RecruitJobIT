import type { CompanyPackageRegistration } from "@/services/company-admin/types";
import { formatDateTime } from "./package-format";

// Section hiển thị gói hiện tại của công ty.
// Được dùng để cho owner biết trạng thái hiệu lực và thanh toán ngay trên đầu màn packages.
type CurrentPlanSectionProps = {
  currentPlan: CompanyPackageRegistration | null;
};

function isPaid(paymentStatus: string | null) {
  return ["PAID", "SUCCESS", "COMPLETED", "DONE"].includes((paymentStatus ?? "").trim().toUpperCase());
}

function resolvePlanStatus(currentPlan: CompanyPackageRegistration) {
  const now = new Date();
  const startsAt = currentPlan.batDauLuc ? new Date(currentPlan.batDauLuc) : null;
  const endsAt = currentPlan.hetHanLuc ? new Date(currentPlan.hetHanLuc) : null;

  if (currentPlan.coHieuLuc) {
    return {
      label: "Đang hoạt động",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (!isPaid(currentPlan.trangThaiThanhToan)) {
    return {
      label: "Chưa thanh toán",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (startsAt && startsAt > now) {
    return {
      label: "Chờ hiệu lực",
      className: "border-indigo-200 bg-indigo-50 text-indigo-800",
    };
  }

  if (endsAt && endsAt < now) {
    return {
      label: "Đã hết hạn",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Chưa hiệu lực",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

export function CurrentPlanSection({ currentPlan }: CurrentPlanSectionProps) {
  const planStatus = currentPlan ? resolvePlanStatus(currentPlan) : null;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Gói hiện tại / kế tiếp</p>
      <div className="mt-3 text-sm text-slate-700">
        {currentPlan && planStatus ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{currentPlan.tenGoi ?? "--"}</p>
              <span className={`rounded border px-2 py-0.5 text-xs font-medium ${planStatus.className}`}>
                {planStatus.label}
              </span>
              <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                {currentPlan.trangThaiThanhToan ?? "--"}
              </span>
            </div>
            <p className="mt-2 text-slate-600">Hiệu lực từ: {formatDateTime(currentPlan.batDauLuc)}</p>
            <p className="mt-2 text-slate-600">Hiệu lực đến: {formatDateTime(currentPlan.hetHanLuc)}</p>
          </>
        ) : (
          <p className="text-slate-600">Chưa có gói hoạt động.</p>
        )}
      </div>
    </section>
  );
}
