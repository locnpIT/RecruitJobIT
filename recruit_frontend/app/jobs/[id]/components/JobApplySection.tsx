import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";

type JobApplySectionProps = {
  chatOpenError: string;
  applyNotice: string;
};

// Khối CTA cuối trang job detail: hiển thị notice và CTA đăng ký nhận việc.
export function JobApplySection({ chatOpenError, applyNotice }: JobApplySectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10">
      {chatOpenError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {chatOpenError}
        </div>
      ) : null}
      {applyNotice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          {applyNotice}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-900">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-950">Nhận việc làm phù hợp với bạn</p>
            <p className="mt-1 text-sm text-slate-600">
              Đăng ký để nhận các công việc mới nhất theo kỹ năng và mong muốn của bạn.
            </p>
          </div>
        </div>
        <Link
          href="/auth/register/candidate"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Đăng ký nhận việc
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
