import Link from "next/link";

// Header trang việc làm yêu thích của ứng viên.
export function FavoriteJobsHeader() {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">Việc làm yêu thích</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Danh sách các tin bạn đã lưu để xem lại và ứng tuyển sau.
        </p>
      </div>
      <Link
        href="/jobs"
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        Xem thêm việc làm
      </Link>
    </div>
  );
}
