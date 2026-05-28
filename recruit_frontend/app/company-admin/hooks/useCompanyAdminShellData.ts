"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { companyAdminService } from "@/services/company-admin.service";

// Dùng cho CompanyAdminShell: nạp thông tin công ty/role và xử lý redirect theo trạng thái + quyền.
export function useCompanyAdminShellData() {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);

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

    companyAdminService
      .getMe()
      .then(async (response) => {
        if (!active) {
          return;
        }
        syncCompany(response.congTy.logoUrl, response.congTy.ten, response.congTy.trangThai ?? null);
        const branches = response.chiNhanhs ?? [];
        setCompanyRole(resolveHighestCompanyRole(branches));

        const branchIds = branches
          .map((branch) => branch.chiNhanhId)
          .filter((branchId): branchId is number => branchId != null);

        if (branchIds.length > 0) {
          const applicationLists = await Promise.all(branchIds.map((branchId) => companyAdminService.getApplications(branchId)));
          if (!active) {
            return;
          }
          setApplicationCount(applicationLists.reduce((total, applications) => total + applications.length, 0));
        } else {
          setApplicationCount(0);
        }

        if (response.congTy.trangThai?.toUpperCase() === "REJECTED" && pathname === "/company-admin") {
          router.replace("/company-admin/settings");
        }
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
        if (!active) {
          return;
        }
        setCompanyName(null);
        setCompanyLogo(null);
        setCompanyStatus(null);
        setCompanyRole(null);
        setApplicationCount(0);
      });

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

  return {
    companyName,
    companyLogo,
    companyStatus,
    companyRole,
    applicationCount,
  };
}
