import type { Metadata } from "next";

import { PlansAdminClient } from "./PlansAdminClient";

export const metadata: Metadata = {
  title: "Gói dịch vụ | Admin",
};

// Page server wrapper cho màn quản lý gói admin.
// Giữ metadata ở cấp route và giao phần tương tác cho client component.
export default function PlansAdminPage() {
  return <PlansAdminClient />;
}
