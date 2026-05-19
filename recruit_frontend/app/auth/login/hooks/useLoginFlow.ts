"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setAuthCookie } from "@/lib/auth-cookie";
import { authService } from "@/services/auth.service";
import { companyAdminService } from "@/services/company-admin.service";
import type { LoginFormValues } from "../components/LoginForm";

// Dùng cho màn /auth/login: xử lý login + lưu session + điều hướng theo role/trạng thái công ty.
export function useLoginFlow() {
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

  return {
    isLoading,
    onSubmit,
  };
}
