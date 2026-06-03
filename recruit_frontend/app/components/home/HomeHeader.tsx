"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useHomeHeaderData } from "./hooks/useHomeHeaderData";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserMenuDropdown } from "./UserMenuDropdown";

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
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleNotificationScroll = (event: UIEvent<HTMLDivElement>) => {
    if (headerData.loadingMoreNotifications || headerData.loadingNotifications || !headerData.notificationHasNext) {
      return;
    }
    const container = event.currentTarget;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (nearBottom) {
      void headerData.loadMoreNotifications();
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
            <NotificationDropdown
              open={notificationOpen}
              dropdownRef={notificationRef}
              data={headerData}
              onToggle={() => { setNotificationOpen((v) => !v); setUserMenuOpen(false); }}
              onClose={() => setNotificationOpen(false)}
              onScroll={handleNotificationScroll}
            />
            <UserMenuDropdown
              open={userMenuOpen}
              dropdownRef={userMenuRef}
              data={headerData}
              onToggle={() => { setUserMenuOpen((v) => !v); setNotificationOpen(false); }}
              onClose={() => setUserMenuOpen(false)}
            />
          </div>
        )}
      </div>
    </header>
  );
}
