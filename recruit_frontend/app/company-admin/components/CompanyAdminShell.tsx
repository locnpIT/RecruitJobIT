"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CompanyAdminSidebar } from "./CompanyAdminSidebar";
import { companyAdminService } from "@/services/company-admin.service";

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
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>(null);

  /**
   * Vai trò hệ thống lưu trong token/local storage là lớp quyền cao hơn vai trò công ty.
   * Nếu user thật sự là ADMIN thì không nên cho ở lại shell company-admin.
   */
  const getStoredSystemRole = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as { vaiTro?: string | null };
      return typeof parsed?.vaiTro === "string" ? parsed.vaiTro.toUpperCase() : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    /**
     * Gom việc cập nhật tên/logo/trạng thái vào một helper để tái sử dụng
     * cho cả response API ban đầu lẫn các custom event sau khi người dùng chỉnh sửa.
     */
    const syncCompany = (logoUrl?: string | null, name?: string | null, status?: string | null) => {
      if (typeof name !== "undefined") {
        setCompanyName(name);
      }
      if (typeof logoUrl !== "undefined") {
        setCompanyLogo(logoUrl);
      }
      if (typeof status !== "undefined") {
        setCompanyStatus(status);
      }
    };

    /**
     * Khi một người dùng có nhiều membership, UI cần biết vai trò công ty cao nhất
     * để quyết định mở hay khóa các menu như gói công ty, HR, cấu hình công ty.
     */
    const resolveHighestCompanyRole = (branches: Array<{ vaiTroCongTy?: string | null }>) => {
      const roles = branches
        .map((branch) => branch.vaiTroCongTy?.toUpperCase() ?? null)
        .filter((role): role is string => Boolean(role));
      if (roles.includes("OWNER")) {
        return "OWNER";
      }
      if (roles.includes("MASTER_BRANCH")) {
        return "MASTER_BRANCH";
      }
      if (roles.includes("HR")) {
        return "HR";
      }
      return null;
    };

    if (getStoredSystemRole() === "ADMIN") {
      window.location.replace("/admin");
      return () => {
        active = false;
      };
    }

    companyAdminService.getMe()
      .then((response) => {
        if (!active) return;
        syncCompany(response.congTy.logoUrl, response.congTy.ten, response.congTy.trangThai ?? null);
        setCompanyRole(resolveHighestCompanyRole(response.chiNhanhs ?? []));
        // Nếu công ty bị từ chối thì ưu tiên đưa người dùng sang trang chỉnh sửa/gửi duyệt lại.
        if (response.congTy.trangThai?.toUpperCase() === "REJECTED" && pathname === "/company-admin") {
          router.replace("/company-admin/settings");
        }
        // Với công ty đã duyệt nhưng user không phải OWNER, khóa các route owner-only ngay từ shell.
        if (response.congTy.trangThai?.toUpperCase() === "APPROVED") {
          const role = resolveHighestCompanyRole(response.chiNhanhs ?? []);
          if (role !== "OWNER" && (pathname === "/company-admin/settings" || pathname === "/company-admin/hr")) {
            router.replace("/company-admin");
          }
          if (role !== "OWNER" && pathname === "/company-admin/packages") {
            router.replace("/company-admin");
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setCompanyName(null);
        setCompanyLogo(null);
        setCompanyStatus(null);
        setCompanyRole(null);
      });

    // Các custom event này được phát ra từ settings page sau khi cập nhật logo hoặc thông tin công ty.
    const handleLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ logoUrl?: string | null; companyName?: string | null }>;
      syncCompany(customEvent.detail?.logoUrl, customEvent.detail?.companyName);
    };

    const handleInfoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ companyName?: string | null; companyStatus?: string | null }>;
      syncCompany(undefined, customEvent.detail?.companyName, customEvent.detail?.companyStatus);
    };

    const handleStatusUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ companyStatus?: string | null }>;
      syncCompany(undefined, undefined, customEvent.detail?.companyStatus);
    };

    window.addEventListener("company-logo-updated", handleLogoUpdated as EventListener);
    window.addEventListener("company-info-updated", handleInfoUpdated as EventListener);
    window.addEventListener("company-status-updated", handleStatusUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener("company-logo-updated", handleLogoUpdated as EventListener);
      window.removeEventListener("company-info-updated", handleInfoUpdated as EventListener);
      window.removeEventListener("company-status-updated", handleStatusUpdated as EventListener);
    };
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[272px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Company Admin</p>
          <h1 className="text-base font-semibold text-slate-900">Doanh nghiệp</h1>
        </div>

        <button
          type="button"
          aria-label="Mở menu"
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
        >
          ☰
        </button>
      </header>

      {isMenuOpen ? (
        <button
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
        companyName={companyName}
        companyLogo={companyLogo}
        companyStatus={companyStatus}
        companyRole={companyRole}
      />

      {/* Nội dung thực tế của từng route doanh nghiệp được render tại đây. */}
      <main className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
