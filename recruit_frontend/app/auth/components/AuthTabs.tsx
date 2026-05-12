import Link from "next/link";

// Tab chuyển nhanh giữa 2 luồng đăng ký chính:
// ứng viên cá nhân và doanh nghiệp/nhà tuyển dụng.
export function AuthTabs({ current }: { current: "candidate" | "owner" }) {
  return (
    <div className="mx-auto flex max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-1">
      <Link
        href="/auth/register/candidate"
        className={`flex-1 rounded-md py-2 text-center text-sm font-medium ${
          current === "candidate" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        Ứng viên
      </Link>
      <Link
        href="/auth/register/owner"
        className={`flex-1 rounded-md py-2 text-center text-sm font-medium ${
          current === "owner" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        Công ty
      </Link>
    </div>
  );
}
