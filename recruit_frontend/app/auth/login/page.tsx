"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { authService } from "@/services/auth.service";
import { companyAdminService } from "@/services/company-admin.service";
import { setAuthCookie } from "@/lib/auth-cookie";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthCard, AuthLayout, AuthSectionHeader } from "../components/AuthLayout";

// Trang đăng nhập hệ thống.
// Sau khi login thành công sẽ điều hướng theo vai trò: admin, company-admin hoặc public home.
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

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

        <form className="mt-7 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Email
              </label>
              <Input
                {...register("email")}
                placeholder="email@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Input
                  {...register("matKhau")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={errors.matKhau ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.matKhau && (
                <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>

          <div className="space-y-4 border-t border-slate-100 pt-5 text-center">
            <div className="text-sm text-slate-600">
              Chưa có tài khoản?{" "}
              <Link href="/auth/register/candidate" className="font-bold text-blue-600 hover:underline">
                Đăng ký Ứng viên
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Hoặc bạn là doanh nghiệp?</span></div>
            </div>
            <Link href="/auth/register/owner" className="block text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
              Đăng ký trở thành Nhà tuyển dụng →
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
