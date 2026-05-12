import { Button } from "@/components/ui/Button";
import type { CompanyPackagePlan, CompanyPackageRegistration } from "@/services/company-admin.service";
import { formatMoney } from "./package-format";

// Section render danh sách gói mở bán cho công ty.
// Component này chỉ lo presentation + CTA đăng ký, còn logic thanh toán nằm ở container page.
type PackageCardsSectionProps = {
  plans: CompanyPackagePlan[];
  currentPlan: CompanyPackageRegistration | null;
  submittingPlanId: number | null;
  onRegister: (plan: CompanyPackagePlan) => void;
};

export function PackageCardsSection({ plans, currentPlan, submittingPlanId, onRegister }: PackageCardsSectionProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Danh sách gói đang mở bán</h2>
        <p className="text-xs text-slate-500">{plans.length} gói</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id ?? plan.maGoi} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{plan.maGoi ?? "--"}</p>
              {plan.soNgayHieuLuc === 90 ? (
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Phổ biến</span>
              ) : null}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{plan.tenGoi ?? "--"}</h3>

            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900">{formatMoney(plan.giaNiemYet)}</p>
              <p className="mt-1 text-sm text-slate-600">Thời hạn {plan.soNgayHieuLuc ?? "--"} ngày</p>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Phù hợp để đăng tin tuyển dụng định kỳ</li>
              <li>Hỗ trợ kích hoạt tự động sau thanh toán</li>
              <li>Theo dõi trạng thái gói ngay trong hệ thống</li>
            </ul>

            <div className="mt-auto pt-5">
              <p className="mb-2 text-xs text-slate-500">{currentPlan?.danhMucGoiId === plan.id ? "Gói hiện tại" : "Sẵn sàng kích hoạt"}</p>
              <Button
                type="button"
                variant={plan.soNgayHieuLuc === 90 ? "primary" : "outline"}
                className="w-full"
                disabled={submittingPlanId === plan.id}
                onClick={() => onRegister(plan)}
              >
                {submittingPlanId === plan.id
                  ? "Đang đăng ký..."
                  : currentPlan?.danhMucGoiId === plan.id
                    ? "Gia hạn gói"
                    : "Đăng ký gói này"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
