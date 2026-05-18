"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthCard, AuthLayout, AuthSectionHeader } from "../../components/AuthLayout";
import { AuthTabs } from "../../components/AuthTabs";
import { CandidateRegisterForm, type RegisterFormValues } from "./components/CandidateRegisterForm";

// Trang đăng ký ứng viên.
// Form này tạo tài khoản candidate mới và chuyển người dùng về màn login sau khi thành công.

export default function CandidateRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: RegisterFormValues) => {
    // confirmPassword chỉ dùng để kiểm tra ở frontend, không gửi sang backend.
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      void confirmPassword;
      await authService.registerCandidate(registerData);
      toast.success("Đăng ký thành công! Chào mừng bạn.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Đăng ký thất bại. Email có thể đã tồn tại.")
          : "Đăng ký thất bại. Email có thể đã tồn tại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthSectionHeader
          title="Đăng ký ứng viên"
          description="Tạo hồ sơ ứng viên để ứng tuyển nhanh và theo dõi tiến độ minh bạch."
        />

        <div className="mt-5">
          <AuthTabs current="candidate" />
        </div>

        <CandidateRegisterForm isLoading={isLoading} onSubmit={onSubmit} />
      </AuthCard>
    </AuthLayout>
  );
}
