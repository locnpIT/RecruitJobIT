import type { ReactNode } from "react";

import { CompanyAdminShell } from "./components/CompanyAdminShell";

/**
 * Layout gốc cho toàn bộ khu vực quản trị doanh nghiệp.
 * Mọi route `/company-admin/*` dùng chung sidebar, kiểm tra trạng thái công ty
 * và bố cục shell qua component này.
 */
export default function CompanyAdminLayout({ children }: { children: ReactNode }) {
  return <CompanyAdminShell>{children}</CompanyAdminShell>;
}
