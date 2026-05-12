type StatusPillProps = {
  value: string | null | undefined;
};

// Badge trạng thái dùng lại ở nhiều màn admin.
// Chuẩn hóa màu sắc + label tiếng Việt cho các trạng thái nghiệp vụ phổ biến.
const toneClassMap: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-700 border-slate-200",
  LOCKED: "bg-rose-50 text-rose-800 border-rose-200",
  DELETED: "bg-slate-200 text-slate-700 border-slate-300",
  DRAFT: "bg-sky-50 text-sky-800 border-sky-200",
  PAUSED: "bg-amber-50 text-amber-800 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-800 border-rose-200",
  UNPAID: "bg-orange-50 text-orange-800 border-orange-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SUCCESS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
  HIDDEN: "bg-violet-50 text-violet-800 border-violet-200",
  UNVERIFIED: "bg-slate-100 text-slate-700 border-slate-200",
};

const labelMap: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngưng hoạt động",
  LOCKED: "Đã khóa",
  DELETED: "Đã xóa",
  DRAFT: "Nháp",
  PAUSED: "Tạm dừng",
  SUSPENDED: "Bị khóa",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  COMPLETED: "Hoàn tất",
  SUCCESS: "Thành công",
  EXPIRED: "Hết hạn",
  HIDDEN: "Đã ẩn",
  UNVERIFIED: "Chưa xác minh",
};

export function StatusPill({ value }: StatusPillProps) {
  const normalized = (value ?? "UNKNOWN").trim().toUpperCase();
  const toneClass = toneClassMap[normalized] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const label = labelMap[normalized] ?? (value || "Không rõ");

  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}
