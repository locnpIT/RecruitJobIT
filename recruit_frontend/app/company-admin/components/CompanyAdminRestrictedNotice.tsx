type CompanyAdminRestrictedNoticeProps = {
  title?: string;
  description?: string;
  tone?: "neutral" | "danger" | "success";
};

/**
 * Notice dùng chung cho các màn doanh nghiệp bị khóa chức năng
 * khi công ty chưa duyệt hoặc bị từ chối.
 */
export function CompanyAdminRestrictedNotice({
  title = "Công ty chưa được duyệt",
  description = "Hiện tại bạn chỉ có thể cập nhật logo ở mục Tuỳ chỉnh. Các thao tác quản lý khác sẽ mở sau khi công ty được duyệt.",
  tone = "neutral",
}: CompanyAdminRestrictedNoticeProps) {
  const isDanger = tone === "danger";
  const isSuccess = tone === "success";

  return (
    <div
      className={
        isDanger
          ? "border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          : isSuccess
            ? "border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          : "border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
      }
    >
      <p className={isDanger ? "font-semibold text-rose-900" : isSuccess ? "font-semibold text-emerald-900" : "font-medium text-slate-950"}>
        {title}
      </p>
      <p
        className={
          isDanger
            ? "mt-1 leading-6 text-rose-700"
            : isSuccess
              ? "mt-1 leading-6 text-emerald-700"
              : "mt-1 leading-6 text-slate-600"
        }
      >
        {description}
      </p>
    </div>
  );
}
