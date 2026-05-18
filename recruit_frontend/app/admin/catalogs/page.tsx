import type { Metadata } from "next";

import { CatalogsAdminClient } from "./CatalogsAdminClient";

export const metadata: Metadata = {
  title: "Danh mục hệ thống | Admin",
};

// Route wrapper cho màn CRUD danh mục hệ thống.
// Giữ metadata ở server component, phần tương tác chuyển xuống client component.
export default function AdminCatalogsPage() {
  return <CatalogsAdminClient />;
}
