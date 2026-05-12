import type { ReactNode } from "react";
import { Noto_Sans } from "next/font/google";

import { AdminShell } from "./components/AdminShell";

/**
 * Layout gốc của toàn bộ khu vực `/admin`.
 * Mọi page quản trị sẽ đi qua file này để dùng chung font, nền, màu chữ
 * và shell điều hướng bên ngoài.
 */
const adminFont = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin-sans",
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${adminFont.variable} min-h-screen bg-slate-50 text-slate-900 [font-family:var(--font-admin-sans)]`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
