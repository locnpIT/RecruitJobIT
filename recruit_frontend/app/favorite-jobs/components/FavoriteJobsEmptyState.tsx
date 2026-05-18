import Link from "next/link";

// Empty state khi candidate chưa lưu tin nào.
export function FavoriteJobsEmptyState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="font-semibold text-slate-950">Bạn chưa lưu tin tuyển dụng nào</p>
      <p className="mt-2 text-sm text-slate-600">
        Khi thấy tin phù hợp, hãy bấm “Lưu tin tuyển dụng” để quay lại sau.
      </p>
      <Link
        href="/jobs"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Tìm việc ngay
      </Link>
    </div>
  );
}
