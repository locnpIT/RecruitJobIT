export type CompanyAdminNavItem = {
  label: string;
  href: string;
  requiresApprovedCompany?: boolean;
  requiresOwnerCompany?: boolean;
};

/**
 * Cấu hình menu của doanh nghiệp.
 * Hai cờ `requiresApprovedCompany` và `requiresOwnerCompany` cho phép sidebar/shell
 * quyết định hiển thị, disable hoặc redirect mà không hard-code phân quyền ở nhiều nơi.
 */
export const companyAdminNavItems: CompanyAdminNavItem[] = [
  { label: "Tổng quan", href: "/company-admin" },
  { label: "Tin tuyển dụng", href: "/company-admin/jobs", requiresApprovedCompany: true },
  { label: "Ứng viên", href: "/company-admin/applications", requiresApprovedCompany: true },
  { label: "Tin nhắn", href: "/company-admin/messages", requiresApprovedCompany: true },
  { label: "Chi nhánh", href: "/company-admin/branches", requiresApprovedCompany: true },
  { label: "Nhân sự", href: "/company-admin/hr", requiresApprovedCompany: true },
  { label: "Gói công ty", href: "/company-admin/packages", requiresApprovedCompany: true, requiresOwnerCompany: true },
  { label: "Tuỳ chỉnh", href: "/company-admin/settings" },
];
