type CompanyResubmitSectionProps = {
  isResubmitting: boolean;
  onResubmit: () => void;
};

// Khối thao tác gửi duyệt lại hồ sơ công ty.
export function CompanyResubmitSection({ isResubmitting, onResubmit }: CompanyResubmitSectionProps) {
  return (
    <div className="border-t border-slate-200 pt-6">
      <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Gửi duyệt lại
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Nút này sẽ lưu các thay đổi hiện tại rồi gửi hồ sơ để admin hệ thống duyệt lại.
      </p>
      <button
        type="button"
        onClick={onResubmit}
        disabled={isResubmitting}
        className="mt-4 inline-flex items-center justify-center border border-emerald-600 px-4 py-3 text-sm font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {isResubmitting ? "Đang gửi..." : "Gửi duyệt lại"}
      </button>
    </div>
  );
}
