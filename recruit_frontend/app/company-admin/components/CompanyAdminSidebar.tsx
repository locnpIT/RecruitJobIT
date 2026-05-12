"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { isCompanyApproved } from "../company-admin-status";
import { companyAdminNavItems } from "../company-admin-nav";
import { clearAuthCookie } from "@/lib/auth-cookie";

type CompanyAdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  companyName?: string | null;
  companyLogo?: string | null;
  companyStatus?: string | null;
  companyRole?: string | null;
};

/**
 * Sidebar của doanh nghiệp.
 * Logic ở đây không chỉ tô active state mà còn khóa menu theo:
 * - trạng thái công ty đã được duyệt hay chưa
 * - vai trò OWNER hay không
 */
export function CompanyAdminSidebar({
  isOpen = false,
  onClose,
  onNavigate,
  companyName,
  companyLogo,
  companyStatus,
  companyRole,
}: CompanyAdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const companyApproved = isCompanyApproved(companyStatus);
  const companyRejected = companyStatus?.toUpperCase() === "REJECTED";
  const isOwner = companyRole?.toUpperCase() === "OWNER";
  // Fallback hiển thị avatar chữ cái khi công ty chưa có logo.
  const initials = (companyName ?? "Công ty")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogo} alt={companyName ?? "Logo công ty"} className="h-full w-full object-contain p-1" />
            ) : (
              initials || "CT"
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Company Admin</p>
            <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900">{companyName ?? "Doanh nghiệp"}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 lg:hidden"
        >
          ×
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 text-sm">
        {companyAdminNavItems.map((item) => {
          // Owner-only routes bị ẩn hẳn với HR để tránh cảm giác "bấm vào rồi mới bị chặn".
          if (
            (!isOwner && (item.href === "/company-admin/settings" || item.href === "/company-admin/hr"))
            || (item.requiresOwnerCompany && !isOwner)
          ) {
            return null;
          }
          const isActive = pathname === item.href;
          const isDisabled = item.requiresApprovedCompany && !companyApproved;
          return (
            isDisabled ? (
              // Route phụ thuộc công ty đã duyệt thì giữ nguyên label nhưng khóa trạng thái để giải thích flow.
              <span
                key={item.href}
                className="mb-1 block rounded-md px-3 py-2 text-slate-400"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`mb-1 block rounded-md px-3 py-2 transition ${
                  isActive ? "bg-slate-900 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            )
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        {!companyApproved ? (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-800">
            {companyRejected
              ? "Công ty đã bị từ chối. Chỉ có thể cập nhật logo và gửi duyệt lại ở mục Tuỳ chỉnh."
              : "Công ty đang chờ duyệt. Chỉ có thể cập nhật logo ở mục Tuỳ chỉnh."}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            const confirmed = window.confirm("Bạn có chắc muốn đăng xuất không?");
            if (!confirmed) return;

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            clearAuthCookie();
            // Company admin và public site dùng chung trang login.
            router.replace("/auth/login");
          }}
          className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
