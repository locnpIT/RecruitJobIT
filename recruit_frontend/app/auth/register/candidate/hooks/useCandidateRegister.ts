"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import type { RegisterFormValues } from "../components/CandidateRegisterForm";

// Dùng cho màn auth/register/candidate: submit đăng ký candidate và điều hướng sau khi thành công.
export function useCandidateRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: RegisterFormValues) => {
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

  return {
    isLoading,
    onSubmit,
  };
}
