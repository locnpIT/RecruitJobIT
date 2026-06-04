import type { ReactNode } from "react";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { HomeFooter } from "@/app/components/home/HomeFooter";

// Layout dùng chung cho toàn bộ route auth.
// Mục tiêu là giữ trải nghiệm login/register đồng bộ với phần public của website.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_#e2e8f0_0%,_#f8fafc_45%)] px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <HomeFooter />
    </div>
  );
}

export function AuthSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <h2 className="mt-2 text-3xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

// Card wrapper dùng lại cho các form auth nhỏ/trung bình.
export function AuthCard({ children, maxWidth = "max-w-md" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div className={`mx-auto w-full ${maxWidth} rounded-xl border border-slate-200 bg-white p-7 shadow-sm md:p-8`}>
      {children}
    </div>
  );
}
