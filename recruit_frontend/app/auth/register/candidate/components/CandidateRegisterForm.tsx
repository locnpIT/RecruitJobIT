"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const registerSchema = z
  .object({
    ho: z.string().min(1, "Họ không được để trống"),
    ten: z.string().min(1, "Tên không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    soDienThoai: z.string().min(10, "Số điện thoại không hợp lệ"),
    matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.matKhau === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

type CandidateRegisterFormProps = {
  isLoading: boolean;
  onSubmit: (data: RegisterFormValues) => Promise<void>;
};

// Form đăng ký candidate tách khỏi page để giảm độ dài page và dễ bảo trì rule validate.
export function CandidateRegisterForm({ isLoading, onSubmit }: CandidateRegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit((data) => void onSubmit(data))}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Họ</label>
          <Input {...register("ho")} placeholder="Nguyễn" />
          {errors.ho ? <p className="mt-1 text-xs text-red-500">{errors.ho.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Tên</label>
          <Input {...register("ten")} placeholder="Văn A" />
          {errors.ten ? <p className="mt-1 text-xs text-red-500">{errors.ten.message}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input {...register("email")} className="pl-10" placeholder="email@example.com" />
        </div>
        {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Số điện thoại</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input {...register("soDienThoai")} className="pl-10" placeholder="0123456789" />
        </div>
        {errors.soDienThoai ? <p className="mt-1 text-xs text-red-500">{errors.soDienThoai.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu</label>
        <Input {...register("matKhau")} type="password" placeholder="••••••••" />
        {errors.matKhau ? <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-900">Xác nhận mật khẩu</label>
        <Input {...register("confirmPassword")} type="password" placeholder="••••••••" />
        {errors.confirmPassword ? <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Đăng ký tài khoản"
        )}
      </Button>

      <p className="pt-3 text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="font-semibold text-slate-900 hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  );
}
