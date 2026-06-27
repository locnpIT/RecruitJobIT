"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout, AuthCard, AuthSectionHeader } from "../components/AuthLayout";
import { authService } from "@/services/auth/auth.service";

const emailSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const resetSchema = z.object({
  maXacNhan: z.string().min(6, "Mã xác nhận phải 6 ký tự").max(6, "Mã xác nhận phải 6 ký tự"),
  matKhauMoi: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  xacNhanMatKhau: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.matKhauMoi === data.xacNhanMatKhau, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["xacNhanMatKhau"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [emailSentTo, setEmailSentTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  async function onSubmitEmail(data: EmailFormValues) {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authService.forgotPassword(data.email);
      setEmailSentTo(data.email);
      setStep("otp");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitReset(data: ResetFormValues) {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authService.resetPassword({
        email: emailSentTo,
        maXacNhan: data.maXacNhan,
        matKhauMoi: data.matKhauMoi,
      });
      setStep("done");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? "Mã xác nhận không đúng hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onResend() {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authService.forgotPassword(emailSentTo);
    } catch {
      // silently ignore resend errors
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        {step === "email" && (
          <>
            <AuthSectionHeader
              title="Quên mật khẩu"
              description="Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu."
            />
            <form className="mt-7 space-y-5" onSubmit={emailForm.handleSubmit((d) => void onSubmitEmail(d))}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
                <Input
                  {...emailForm.register("email")}
                  placeholder="email@example.com"
                  className={emailForm.formState.errors.email ? "border-red-500" : ""}
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</> : "Gửi mã xác nhận"}
              </Button>
              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                  <ArrowLeft size={14} /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <AuthSectionHeader
              title="Nhập mã xác nhận"
              description={`Mã 6 số đã được gửi về ${emailSentTo}`}
            />
            <form className="mt-7 space-y-5" onSubmit={resetForm.handleSubmit((d) => void onSubmitReset(d))}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Mã xác nhận</label>
                <Input
                  {...resetForm.register("maXacNhan")}
                  placeholder="123456"
                  maxLength={6}
                  className={`text-center text-xl tracking-widest font-bold ${resetForm.formState.errors.maXacNhan ? "border-red-500" : ""}`}
                />
                {resetForm.formState.errors.maXacNhan && (
                  <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.maXacNhan.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu mới</label>
                <div className="relative">
                  <Input
                    {...resetForm.register("matKhauMoi")}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pr-11 ${resetForm.formState.errors.matKhauMoi ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="unstyled"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowNewPassword((current) => !current)}
                    aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                {resetForm.formState.errors.matKhauMoi && (
                  <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.matKhauMoi.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Input
                    {...resetForm.register("xacNhanMatKhau")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pr-11 ${resetForm.formState.errors.xacNhanMatKhau ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="unstyled"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                {resetForm.formState.errors.xacNhanMatKhau && (
                  <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.xacNhanMatKhau.message}</p>
                )}
              </div>
              {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</> : "Đặt lại mật khẩu"}
              </Button>
              <div className="text-center text-sm text-slate-500">
                Không nhận được mã?{" "}
                <button
                  type="button"
                  onClick={() => void onResend()}
                  disabled={isLoading}
                  className="font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  Gửi lại
                </button>
              </div>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h2 className="text-2xl font-bold text-slate-900">Đặt lại thành công!</h2>
            <p className="mt-2 text-sm text-slate-600">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.</p>
            <Button className="mt-6 w-full" onClick={() => router.push("/auth/login")}>
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
