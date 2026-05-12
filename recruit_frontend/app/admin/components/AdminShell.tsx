"use client";

import Image from "next/image";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AdminSidebar } from "./AdminSidebar";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";

type AdminShellProps = {
  children: ReactNode;
};

/**
 * Shell điều hướng của admin:
 * - dựng sidebar/mobile header dùng chung
 * - theo dõi trạng thái phiên đăng nhập admin
 * - tự đăng xuất khi token hết hạn hoặc backend trả 401/403
 */
export function AdminShell({ children }: AdminShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  /**
   * Luồng đăng xuất tập trung để tránh lặp logic xóa session ở nhiều nơi.
   * Admin area dùng local storage thay vì context auth riêng.
   */
  const logoutAndRedirect = useCallback(() => {
    clearAdminSession();
    router.replace("/auth/login");
  }, [router]);

  const handleLogout = () => {
    const confirmed = window.confirm("Bạn có chắc muốn đăng xuất khỏi trang quản trị không?");
    if (!confirmed) {
      return;
    }

    logoutAndRedirect();
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Từ JWT hiện tại, tính thời điểm hết hạn và chủ động hạ phiên phía client.
     * Cách này giúp admin không tiếp tục thao tác trên UI khi token đã vô hiệu.
     */
    const scheduleExpiryLogout = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logoutAndRedirect();
        return;
      }

      const expiryMs = getJwtExpiryMs(token);
      if (!expiryMs) {
        return;
      }

      const delay = expiryMs - Date.now();
      if (delay <= 0) {
        logoutAndRedirect();
        return;
      }

      timeoutId = setTimeout(() => {
        logoutAndRedirect();
      }, delay + 250);
    };

    /**
     * Ping một endpoint nhẹ của admin để xác minh token thực sự còn hợp lệ trên backend.
     * Việc này bắt các trường hợp token bị thu hồi hoặc session storage bị lệch trạng thái.
     */
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logoutAndRedirect();
        return;
      }

      try {
        await apiClient.get("/admin/stats");
      } catch (error) {
        const status = typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

        if (status === 401 || status === 403) {
          logoutAndRedirect();
        }
      }
    };

    // Kiểm tra ngay khi mount, sau đó duy trì kiểm tra định kỳ mỗi phút.
    void validateSession();
    scheduleExpiryLogout();
    intervalId = setInterval(validateSession, 60_000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [logoutAndRedirect]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="grid h-11 w-[170px] place-content-center overflow-hidden rounded-md border border-slate-200 bg-white px-2">
          <Image
            src="/logo-web-recruit-header.png"
            alt="Recruit Logo"
            width={170}
            height={44}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        <button
          type="button"
          aria-label="Mở menu quản trị"
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {isMenuOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden"
        />
      ) : null}

      <AdminSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Nội dung của từng route con trong admin sẽ được render vào vùng main này. */}
      <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
