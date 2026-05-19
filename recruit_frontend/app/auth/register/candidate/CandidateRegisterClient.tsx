"use client";

import { AuthCard, AuthLayout, AuthSectionHeader } from "../../components/AuthLayout";
import { AuthTabs } from "../../components/AuthTabs";
import { CandidateRegisterForm } from "./components/CandidateRegisterForm";
import { useCandidateRegister } from "./hooks/useCandidateRegister";

// Client container cho trang /auth/register/candidate.
export function CandidateRegisterClient() {
  const registerFlow = useCandidateRegister();

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

        <CandidateRegisterForm isLoading={registerFlow.isLoading} onSubmit={registerFlow.onSubmit} />
      </AuthCard>
    </AuthLayout>
  );
}
