"use client";

import { useState } from "react";

import { authService } from "@/services/auth.service";
import { companyAdminService } from "@/services/company-admin.service";
import { setAuthCookie } from "@/lib/auth-cookie";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthCard, AuthLayout, AuthSectionHeader } from "../components/AuthLayout";
import { LoginForm, type LoginFormValues } from "./components/LoginForm";

// Trang đăng nhập hệ thống.
// Sau khi login thành công sẽ điều hướng theo vai trò: admin, company-admin hoặc public home.

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authResponse = await authService.login(data);

      if (!authResponse?.phienDangNhap || !authResponse?.nguoiDung) {
        throw new Error("Cấu trúc phản hồi không khớp.");
      }

      localStorage.setItem("token", authResponse.phienDangNhap.accessToken);
      localStorage.setItem("user", JSON.stringify(authResponse.nguoiDung));
      setAuthCookie(authResponse.phienDangNhap.accessToken, authResponse.phienDangNhap.thoiHanTokenGiay);

      toast.success("Đăng nhập thành công!");

      const role = authResponse.nguoiDung.vaiTro?.toUpperCase();
      if (role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      try {
        const companyAdminMe = await companyAdminService.getMe();
        if (companyAdminMe.congTy.trangThai?.toUpperCase() === "REJECTED") {
          router.replace("/company-admin/settings");
          return;
        }
        router.replace("/company-admin");
      } catch {
        router.replace("/");
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Đăng nhập thất bại.")
          : error instanceof Error
            ? error.message
            : "Đăng nhập thất bại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthSectionHeader
          title="Đăng nhập hệ thống"
          description="Truy cập khu vực quản trị hồ sơ, tin tuyển dụng và quy trình vận hành."
        />
        <LoginForm isLoading={isLoading} onSubmit={onSubmit} />
      </AuthCard>
    </AuthLayout>
  );
}
