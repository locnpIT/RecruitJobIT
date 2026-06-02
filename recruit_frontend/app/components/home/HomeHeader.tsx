"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { clearAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/Button";
import { useHomeHeaderData } from "./hooks/useHomeHeaderData";

// Header dùng chung cho khu public/auth/profile.
// API thông báo + đọc session được tách sang hook useHomeHeaderData để page/component chỉ còn UI wiring.
export function HomeHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const headerData = useHomeHeaderData();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleNotificationScroll = (event: UIEvent<HTMLDivElement>) => {
    if (headerData.loadingMoreNotifications || headerData.loadingNotifications || !headerData.notificationHasNext) {
      return;
    }
    const container = event.currentTarget;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (!nearBottom) {
      return;
    }
    void headerData.loadMoreNotifications();
  };

  const handleClickNotification = async (item: (typeof headerData.latestNotifications)[number]) => {
    try {
      await headerData.markReadAndSync(item);
    } catch {
      // Không chặn điều hướng nếu API markRead lỗi.
    }

    setNotificationOpen(false);
    if (item.duongDan) {
      window.location.assign(item.duongDan);
    }
  };

  const handleDeleteNotification = async (item: (typeof headerData.latestNotifications)[number]) => {
    try {
      await headerData.deleteNotification(item);
    } catch {
      // ignore
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="relative block h-[50px] w-[250px] overflow-hidden">
            <Image
              src="/logo-web-recruit-header.png"
              alt="Recruit Logo"
              fill
              sizes="250px"
              className="object-cover object-center"
              priority
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Trang chủ
          </Link>
          <Link
            href="/jobs"
            className={`text-sm font-medium transition-colors ${
              pathname?.startsWith("/jobs") ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Việc làm
          </Link>
        </nav>

        {!headerData.user && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-10 px-4" onClick={() => router.push("/auth/login")}>
              Đăng nhập
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-10 px-4"
              onClick={() => router.push("/auth/register/candidate")}
            >
              Đăng ký
            </Button>
          </div>
        )}

        {headerData.user && (
          <div className="flex items-center gap-2">
            <div ref={notificationRef} className="relative">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => {
                  setNotificationOpen((current) => !current);
                  setUserMenuOpen(false);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-md p-0 text-slate-700 hover:bg-slate-100"
                aria-label="Mở thông báo"
              >
                <Bell className="h-5 w-5" />
                {headerData.unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                    {headerData.unreadCount > 99 ? "99+" : headerData.unreadCount}
                  </span>
                ) : null}
              </Button>
              {notificationOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={() => void headerData.markAllRead()}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Đánh dấu đã đọc
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto" onScroll={handleNotificationScroll}>
                    {headerData.loadingNotifications ? (
                      <p className="px-2 py-4 text-xs text-slate-500">Đang tải thông báo...</p>
                    ) : null}
                    {!headerData.loadingNotifications && headerData.latestNotifications.length === 0 ? (
                      <p className="px-2 py-4 text-xs text-slate-500">Chưa có thông báo nào.</p>
                    ) : null}
                    {!headerData.loadingNotifications
                      ? headerData.latestNotifications.map((item) => (
                          <div
                            key={item.id}
                            className={`mb-1 rounded-md border px-2 py-5 ${
                              item.daDoc ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => void handleClickNotification(item)}
                                className="flex-1 text-left hover:bg-slate-50"
                              >
                                <p className="text-xs font-semibold text-slate-900">{item.tieuDe}</p>
                                <p className="mt-1 text-xs text-slate-600">{item.noiDung}</p>
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => void handleDeleteNotification(item)}
                                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                                aria-label="Xoá thông báo"
                              >
                                Xoá
                              </Button>
                            </div>
                          </div>
                        ))
                      : null}
                    {headerData.loadingMoreNotifications ? (
                      <p className="px-2 py-3 text-center text-xs text-slate-500">Đang tải thêm...</p>
                    ) : null}
                    {!headerData.loadingMoreNotifications && headerData.notificationHasNext ? (
                      <p className="px-2 py-3 text-center text-xs text-slate-500">Kéo xuống để tải thêm</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={userMenuRef} className="relative">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => {
                  setUserMenuOpen((current) => !current);
                  setNotificationOpen(false);
                }}
                className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full p-0 text-sm font-semibold ${
                  headerData.user.anhDaiDienUrl ? "bg-slate-100" : "bg-slate-900 text-white"
                }`}
                aria-label="Mở menu tài khoản"
              >
                {headerData.user.anhDaiDienUrl ? (
                  <span className="relative block h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={headerData.user.anhDaiDienUrl}
                      alt="Avatar người dùng"
                      fill
                      sizes="40px"
                      className="object-cover object-center"
                    />
                  </span>
                ) : (
                  headerData.userInitial
                )}
              </Button>
              {userMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-2 rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{headerData.fullName}</p>
                    <p className="text-xs text-slate-600">{headerData.user.email}</p>
                  </div>
                  {headerData.isCandidate ? (
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Hồ sơ
                    </Link>
                  ) : (
                    <Link
                      href={headerData.role === "ADMIN" ? "/admin" : "/company-admin"}
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Vào hệ thống
                    </Link>
                  )}
                  {headerData.isCandidate ? (
                    <Link
                      href="/messages"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Tin nhắn
                    </Link>
                  ) : null}
                  {headerData.isCandidate ? (
                    <Link
                      href="/favorite-jobs"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Việc làm yêu thích
                    </Link>
                  ) : null}
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => {
                      clearAdminSession();
                      window.location.assign("/");
                    }}
                    className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Đăng xuất
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
