"use client";

import { AuthCard, AuthLayout, AuthSectionHeader } from "../components/AuthLayout";
import { LoginForm } from "./components/LoginForm";
import { useLoginFlow } from "./hooks/useLoginFlow";

// Trang đăng nhập hệ thống.
// Sau khi login thành công sẽ điều hướng theo vai trò: admin, company-admin hoặc public home.

export default function LoginPage() {
  const loginFlow = useLoginFlow();

  return (
    <AuthLayout>
      <AuthCard>
        <AuthSectionHeader
          title="Đăng nhập hệ thống"
          description="Truy cập khu vực quản trị hồ sơ, tin tuyển dụng và quy trình vận hành."
        />
        <LoginForm isLoading={loginFlow.isLoading} onSubmit={loginFlow.onSubmit} />
      </AuthCard>
    </AuthLayout>
  );
}
