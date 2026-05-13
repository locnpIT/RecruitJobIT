"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";

// Header dùng chung cho khu public/auth/profile.
// Lưu ý SSR/hydration: không đọc localStorage trực tiếp trong render.
// Nếu render server là "Đăng nhập" nhưng render client ngay lập tức là "Xin chào..." thì React sẽ báo hydration mismatch.
type LocalUser = {
  id: number;
  email: string;
  ten: string | null;
  ho: string | null;
  vaiTro: string;
};

export function HomeHeader() {
  const [user, setUser] = useState<LocalUser | null>(null);

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
            {isCandidate ? (
              <div className="hidden text-sm text-slate-700 md:block">
                Xin chào, <span className="font-semibold text-slate-900">{fullName}</span>
              </div>
            ) : null}
            <Link
              href={isCandidate ? "/profile" : role === "ADMIN" ? "/admin" : "/company-admin"}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isCandidate ? "Hồ sơ" : "Vào hệ thống"}
            </Link>
            {isCandidate ? (
              <Link
                href="/favorite-jobs"
                className="hidden rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"
              >
                Yêu thích
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                clearAdminSession();
                window.location.href = "/";
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
