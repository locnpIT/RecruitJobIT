import type { CompanyPackageRegistration } from "@/services/company-admin.service";
import { formatMoney } from "./package-format";

// Section hiển thị thông tin thanh toán SePay đang chờ xử lý.
// Công ty dùng khối này để quét QR và theo dõi mã thanh toán/nội dung chuyển khoản.
type SepayPaymentSectionProps = {
  payment: CompanyPackageRegistration;
};

export function SepayPaymentSection({ payment }: SepayPaymentSectionProps) {
  return (
    <section className="rounded-md border border-sky-200 bg-sky-50 p-4">
      <p className="text-xs uppercase tracking-wide text-sky-700">Thanh toán SePay</p>
      <p className="mt-2 text-sm text-slate-700">
        Đơn đăng ký đang chờ thanh toán. Sau khi chuyển khoản thành công, hệ thống sẽ tự kích hoạt gói qua webhook.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="space-y-2 text-sm text-slate-800">
          <p>
            Mã thanh toán: <span className="font-semibold">{payment.paymentCode ?? "--"}</span>
          </p>
          <p>
            Nội dung chuyển khoản: <span className="font-semibold">{payment.transferContent ?? payment.paymentCode ?? "--"}</span>
          </p>
          <p>
            Số tiền: <span className="font-semibold text-emerald-800">{formatMoney(payment.giaTaiThoiDiemDangKy)}</span>
          </p>
        </div>
        {payment.qrImageUrl ? (
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <img src={payment.qrImageUrl} alt="Mã QR thanh toán SePay" className="h-60 w-60 max-w-full object-contain" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
