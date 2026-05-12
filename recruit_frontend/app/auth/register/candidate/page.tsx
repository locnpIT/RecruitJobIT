"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthCard, AuthLayout, AuthSectionHeader } from "../../components/AuthLayout";
import { AuthTabs } from "../../components/AuthTabs";

// Trang đăng ký ứng viên.
// Form này tạo tài khoản candidate mới và chuyển người dùng về màn login sau khi thành công.
// Schema phía frontend giúp chặn lỗi sớm trước khi request sang backend.
const registerSchema = z.object({
  ho: z.string().min(1, "Họ không được để trống"),
  ten: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  soDienThoai: z.string().min(10, "Số điện thoại không hợp lệ"),
  matKhau: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.matKhau === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CandidateRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Họ</label>
              <Input {...register("ho")} placeholder="Nguyễn" />
              {errors.ho && <p className="mt-1 text-xs text-red-500">{errors.ho.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Tên</label>
              <Input {...register("ten")} placeholder="Văn A" />
              {errors.ten && <p className="mt-1 text-xs text-red-500">{errors.ten.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input {...register("email")} className="pl-10" placeholder="email@example.com" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input {...register("soDienThoai")} className="pl-10" placeholder="0123456789" />
            </div>
            {errors.soDienThoai && <p className="mt-1 text-xs text-red-500">{errors.soDienThoai.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Mật khẩu</label>
            <Input {...register("matKhau")} type="password" placeholder="••••••••" />
            {errors.matKhau && <p className="mt-1 text-xs text-red-500">{errors.matKhau.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Xác nhận mật khẩu</label>
            <Input {...register("confirmPassword")} type="password" placeholder="••••••••" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
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
      </AuthCard>
    </AuthLayout>
  );
}
