"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  isLoading: boolean;
  onSubmit: (data: LoginFormValues) => Promise<void>;
};

// Form đăng nhập tách riêng khỏi page để page chỉ xử lý điều hướng + side-effect sau login.
export function LoginForm({ isLoading, onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form className="mt-7 space-y-6" onSubmit={handleSubmit((data) => void onSubmit(data))}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
          <Input {...register("email")} placeholder="email@example.com" className={errors.email ? "border-red-500" : ""} />
          {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
        </div>

        <div className="relative">
          <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu</label>
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
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.matKhau ? <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p> : null}
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
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Hoặc bạn là doanh nghiệp?</span>
          </div>
        </div>
        <Link href="/auth/register/owner" className="block text-sm font-bold text-slate-900 transition-colors hover:text-blue-600">
          Đăng ký trở thành Nhà tuyển dụng →
        </Link>
      </div>
    </form>
  );
}
