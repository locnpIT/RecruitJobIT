import type { Metadata } from "next";

import { AdminHeader } from "./components/AdminHeader";
import { AdminDashboardClient } from "./components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | Recruit",
  description: "Giao diện quản trị hệ thống tuyển dụng",
};

/**
 * Entry page của route `/admin`.
 * File này giữ rất mỏng: tách rõ phần header tĩnh và phần client component có gọi API.
 */
export default function AdminPage() {
  return (
    <>
      <AdminHeader />
      <AdminDashboardClient />
    </>
  );
}
