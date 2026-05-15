"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";

// CTA cuối trang chủ cho nhóm ứng viên.
// Mục tiêu là tạo một điểm chuyển đổi mạnh hơn sau khi người dùng đã xem xong homepage.
export function CandidateCtaSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        // Session chỉ được tính là hợp lệ khi còn token và token chưa hết hạn.
        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setIsLoggedIn(false);
          return;
        }

        const rawUser = localStorage.getItem("user");
        setIsLoggedIn(Boolean(rawUser));
      } catch {
        clearAdminSession();
        setIsLoggedIn(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full py-12 md:py-16">
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('/background_2.png')] bg-cover bg-right bg-no-repeat" />

        <div className="relative mx-auto w-full max-w-7xl px-7 py-10 md:px-10 md:py-12 lg:px-14 lg:py-16">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Dành cho ứng viên</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
              Sẵn sàng cho
              <br />
              công việc tiếp theo?
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Tạo hồ sơ miễn phí, khám phá hàng nghìn cơ hội phù hợp với kỹ năng và mục tiêu của bạn.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register/candidate"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Tạo hồ sơ ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
