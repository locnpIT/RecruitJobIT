import clsx from "clsx";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  REVIEWING: "border-sky-200 bg-sky-50 text-sky-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

type ApplicationStatusBadgeProps = {
  status?: string | null;
};

// Badge trạng thái đơn ứng tuyển dùng chung trong bảng và modal chi tiết.
// Giá trị lưu trực tiếp ở DonUngTuyen.trangThai, không cần bảng trạng thái riêng.
export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() ?? "PENDING";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[normalizedStatus] ?? "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {STATUS_LABELS[normalizedStatus] ?? status ?? "--"}
    </span>
  );
}
