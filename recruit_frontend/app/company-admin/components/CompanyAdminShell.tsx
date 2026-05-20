"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

import { CompanyAdminSidebar } from "./CompanyAdminSidebar";
import { useCompanyAdminShellData } from "../hooks/useCompanyAdminShellData";

type CompanyAdminShellProps = {
  children: ReactNode;
};

/**
 * Shell điều hướng của doanh nghiệp sau đăng nhập.
 * Ngoài nhiệm vụ dựng sidebar/header mobile, file này còn đồng bộ:
 * - thông tin công ty hiển thị trên sidebar
 * - role cao nhất trong công ty
 * - redirect mềm theo trạng thái duyệt và quyền OWNER/HR
 */
export function CompanyAdminShell({ children }: CompanyAdminShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shellData = useCompanyAdminShellData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[272px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Company Admin</p>
          <h1 className="text-base font-semibold text-slate-900">Doanh nghiệp</h1>
        </div>

        <Button variant="unstyled"
          type="button"
          aria-label="Mở menu"
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
        >
          ☰
        </Button>
      </header>

      {isMenuOpen ? (
        <Button variant="unstyled"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
        />
      ) : null}

      <CompanyAdminSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={() => setIsMenuOpen(false)}
        companyName={shellData.companyName}
        companyLogo={shellData.companyLogo}
        companyStatus={shellData.companyStatus}
        companyRole={shellData.companyRole}
      />

      {/* Nội dung thực tế của từng route doanh nghiệp được render tại đây. */}
      <main className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
