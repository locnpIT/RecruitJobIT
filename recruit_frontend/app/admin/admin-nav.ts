export type AdminNavItem = {
  label: string;
  href: string;
};

/**
 * Nguồn sự thật cho sidebar admin.
 * Giữ menu ở một file riêng để dễ thêm/bớt route mà không phải sửa trực tiếp component render.
 */
export const adminNavItems: AdminNavItem[] = [
  { label: "Tổng quan", href: "/admin" },
  { label: "Quản lý người dùng", href: "/admin/users" },
  { label: "Duyệt công ty", href: "/admin/companies" },
  { label: "Duyệt tin tuyển dụng", href: "/admin/jobs" },
  { label: "Duyệt hồ sơ ứng viên", href: "/admin/candidate-proofs" },
  { label: "Gói dịch vụ", href: "/admin/plans" },
  { label: "Báo cáo hệ thống", href: "/admin/reports" },
  { label: "Cài đặt", href: "/admin/settings" },
];
