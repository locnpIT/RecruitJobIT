"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavItems } from "../admin-nav";

type AdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  onLogout?: () => void;
};

/**
 * Sidebar điều hướng cố định của khu vực admin.
 * Nguồn sự thật cho menu nằm ở `admin-nav.ts`, component này chỉ render và tô active state.
 */
export function AdminSidebar({ isOpen = false, onClose, onNavigate, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-4 py-5">
        <div className="mb-3 flex items-center justify-end lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu quản trị"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <Link href="/admin" onClick={onNavigate}>
          <div className="grid h-14 w-full place-content-center overflow-hidden bg-white px-2">
            <Image
              src="/logo-web-recruit-header.png"
              alt="Recruit Logo"
              width={240}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      <nav className="space-y-1 px-3 pb-4 text-sm">
        {adminNavItems.map((item) => {
          // Sidebar admin dùng đối sánh tuyệt đối theo route vì các route hiện tại là page cấp 1.
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-md px-3 py-2 transition ${
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Đăng xuất ở cuối menu để tách khỏi nhóm điều hướng chính. */}
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full items-center justify-center rounded-md border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50"
        >
          Đăng xuất
        </button>
      </nav>
    </aside>
  );
}
