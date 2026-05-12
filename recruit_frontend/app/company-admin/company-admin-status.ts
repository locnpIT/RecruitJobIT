/**
 * Helper nhỏ để chuẩn hóa cách kiểm tra trạng thái duyệt công ty ở frontend.
 * Giữ logic này tại một chỗ giúp tránh sai khác chữ hoa/chữ thường giữa các page.
 */
export function isCompanyApproved(status?: string | null): boolean {
  return typeof status === "string" && status.toUpperCase() === "APPROVED";
}
