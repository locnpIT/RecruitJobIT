"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { Bell } from "lucide-react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { notificationService, type NotificationItem } from "@/services/notification.service";

// Header dùng chung cho khu public/auth/profile.
// Lưu ý SSR/hydration: không đọc localStorage trực tiếp trong render.
// Nếu render server là "Đăng nhập" nhưng render client ngay lập tức là "Xin chào..." thì React sẽ báo hydration mismatch.
type LocalUser = {
  id: number;
  email: string;
  ten: string | null;
  ho: string | null;
  vaiTro: string;
  anhDaiDienUrl?: string | null;
};

const NOTIFICATION_PAGE_SIZE = 10;

export function HomeHeader() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);
  const [notificationHasNext, setNotificationHasNext] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Đọc session sau khi component đã mount để server HTML và client HTML lần đầu giống nhau.
    // Promise.resolve() cũng tránh rule React mới về setState đồng bộ ngay trong effect.
    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        // Nếu chỉ còn user trong localStorage nhưng token hết hạn, backend sẽ trả 403.
        // Vì vậy header dọn session cũ trước khi chuyển UI sang trạng thái đã đăng nhập.
        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setUser(null);
          return;
        }

        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as LocalUser) : null);
      } catch {
        clearAdminSession();
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const role = user?.vaiTro?.toUpperCase() ?? null;
  const isCandidate = role === "CANDIDATE";
  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.ho ?? ""} ${user.ten ?? ""}`.trim() || user.email;
  }, [user]);

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
  const userInitial = useMemo(() => {
    const fallback = (user?.email ?? "U").trim();
    const source = (user?.ten ?? user?.ho ?? fallback).trim();
    return source.charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    Promise.resolve().then(() => {
      if (!active) {
        return;
      }

      if (!user) {
        setUnreadCount(0);
        setLatestNotifications([]);
        return;
      }

      const loadNotifications = async () => {
        try {
          setLoadingNotifications(true);
          const [countData, listData] = await Promise.all([
            notificationService.unreadCount(),
            notificationService.list(0, NOTIFICATION_PAGE_SIZE),
          ]);
          if (!active) {
            return;
          }
          setUnreadCount(countData.unreadCount ?? 0);
          setLatestNotifications(listData.items ?? []);
          setNotificationPage(listData.page ?? 0);
          setNotificationHasNext(Boolean(listData.hasNext));
        } catch {
          if (!active) {
            return;
          }
          setUnreadCount(0);
          setLatestNotifications([]);
          setNotificationPage(0);
          setNotificationHasNext(false);
        } finally {
          if (active) {
            setLoadingNotifications(false);
          }
        }
      };

      void loadNotifications();
      timer = window.setInterval(() => {
        void loadNotifications();
      }, 60000);
    });

    return () => {
      active = false;
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [user]);

  const loadMoreNotifications = async () => {
    if (loadingMoreNotifications || loadingNotifications || !notificationHasNext) {
      return;
    }

    try {
      setLoadingMoreNotifications(true);
      const nextPage = notificationPage + 1;
      const listData = await notificationService.list(nextPage, NOTIFICATION_PAGE_SIZE);
      setLatestNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const nextItems = (listData.items ?? []).filter((item) => !existingIds.has(item.id));
        return [...current, ...nextItems];
      });
      setNotificationPage(listData.page ?? nextPage);
      setNotificationHasNext(Boolean(listData.hasNext));
    } catch {
      // ignore
    } finally {
      setLoadingMoreNotifications(false);
    }
  };

  const handleNotificationScroll = (event: UIEvent<HTMLDivElement>) => {
    if (loadingMoreNotifications || loadingNotifications || !notificationHasNext) {
      return;
    }
    const container = event.currentTarget;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (!nearBottom) {
      return;
    }
    void loadMoreNotifications();
  };

  const handleClickNotification = async (item: NotificationItem) => {
    try {
      if (!item.daDoc) {
        await notificationService.markRead(item.id);
        setUnreadCount((current) => (current > 0 ? current - 1 : 0));
        setLatestNotifications((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, daDoc: true } : entry))
        );
      }
    } catch {
      // Không chặn điều hướng nếu API markRead lỗi.
    }

    setNotificationOpen(false);
    if (item.duongDan) {
      window.location.assign(item.duongDan);
    }
  };

  const handleDeleteNotification = async (item: NotificationItem) => {
    try {
      await notificationService.delete(item.id);
      setLatestNotifications((current) => current.filter((entry) => entry.id !== item.id));
      if (!item.daDoc) {
        setUnreadCount((current) => (current > 0 ? current - 1 : 0));
      }
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

          <p className="hidden text-sm leading-6 text-slate-600 md:block">
            Nền tảng tuyển dụng <br />
            doanh nghiệp
          </p>
        </div>

        {!user && (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register/candidate"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Đăng ký
            </Link>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((current) => !current);
                  setUserMenuOpen(false);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
                aria-label="Mở thông báo"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
              {notificationOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const result = await notificationService.markAllRead();
                          if ((result.updatedCount ?? 0) > 0) {
                            setUnreadCount(0);
                            setLatestNotifications((current) => current.map((item) => ({ ...item, daDoc: true })));
                          }
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto" onScroll={handleNotificationScroll}>
                    {loadingNotifications ? (
                      <p className="px-2 py-4 text-xs text-slate-500">Đang tải thông báo...</p>
                    ) : null}
                    {!loadingNotifications && latestNotifications.length === 0 ? (
                      <p className="px-2 py-4 text-xs text-slate-500">Chưa có thông báo nào.</p>
                    ) : null}
                    {!loadingNotifications
                      ? latestNotifications.map((item) => (
                          <div
                            key={item.id}
                            className={`mb-1 rounded-md border px-2 py-2 ${
                              item.daDoc ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => void handleClickNotification(item)}
                                className="flex-1 text-left hover:bg-slate-50"
                              >
                                <p className="text-xs font-semibold text-slate-900">{item.tieuDe}</p>
                                <p className="mt-1 text-xs text-slate-600">{item.noiDung}</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteNotification(item)}
                                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                                aria-label="Xoá thông báo"
                              >
                                Xoá
                              </button>
                            </div>
                          </div>
                        ))
                      : null}
                    {loadingMoreNotifications ? (
                      <p className="px-2 py-3 text-center text-xs text-slate-500">Đang tải thêm...</p>
                    ) : null}
                    {!loadingMoreNotifications && notificationHasNext ? (
                      <p className="px-2 py-3 text-center text-xs text-slate-500">Kéo xuống để tải thêm</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((current) => !current);
                  setNotificationOpen(false);
                }}
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white"
                aria-label="Mở menu tài khoản"
              >
                {user?.anhDaiDienUrl ? (
                  <Image
                    src={user.anhDaiDienUrl}
                    alt="Avatar người dùng"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  userInitial
                )}
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-2 rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                  {isCandidate ? (
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Hồ sơ
                    </Link>
                  ) : (
                    <Link
                      href={role === "ADMIN" ? "/admin" : "/company-admin"}
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Vào hệ thống
                    </Link>
                  )}
                  {isCandidate ? (
                    <Link
                      href="/messages"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Tin nhắn
                    </Link>
                  ) : null}
                  {isCandidate ? (
                    <Link
                      href="/favorite-jobs"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Việc làm yêu thích
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      clearAdminSession();
                      window.location.assign("/");
                    }}
                    className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
