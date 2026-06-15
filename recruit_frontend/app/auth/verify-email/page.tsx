"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Mail, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthLayout } from "../components/AuthLayout";
import { authService } from "@/services/auth/auth.service";

const STATUS_CONTENT = {
  sent: {
    icon: Mail,
    title: "Kiểm tra email của bạn",
    description: "Hệ thống đã gửi mã xác nhận 6 số. Vui lòng nhập mã bên dưới để kích hoạt tài khoản.",
    tone: "text-teal-700 bg-teal-50 border-teal-100",
  },
  success: {
    icon: CheckCircle2,
    title: "Xác nhận email thành công",
    description: "Tài khoản của bạn đã được kích hoạt. Bây giờ bạn có thể đăng nhập và sử dụng hệ thống.",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  error: {
    icon: XCircle,
    title: "Không xác nhận được email",
    description: "Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng thử gửi lại mã.",
    tone: "text-rose-700 bg-rose-50 border-rose-100",
  },
} as const;

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const status = normalizeStatus(searchParams.get("status"));
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const content = useMemo(() => STATUS_CONTENT[status], [status]);
  const Icon = content.icon;

  const onConfirm = async () => {
    if (!email.trim()) {
      toast.error("Thiếu email xác nhận.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Mã xác nhận phải gồm đúng 6 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.confirmEmail({ email, maXacNhan: code.trim() });
      toast.success("Xác nhận email thành công.");
      router.replace(`/auth/verify-email?status=success&email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Xác nhận email thất bại.")
          : "Xác nhận email thất bại.";
      toast.error(message);
      router.replace(`/auth/verify-email?status=error&email=${encodeURIComponent(email)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      toast.error("Thiếu email xác nhận.");
      return;
    }

    setIsResending(true);
    try {
      await authService.resendEmailVerification(email);
      toast.success("Đã gửi lại mã xác nhận.");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            "Gửi lại mã thất bại.")
          : "Gửi lại mã thất bại.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${content.tone}`}>
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">{content.title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{content.description}</p>
          {email ? (
            <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{email}</p>
          ) : null}
        </div>

        {status !== "success" ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Mã xác nhận 6 số</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-center text-lg font-semibold tracking-[0.35em] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="000000"
              />
            </label>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#008080] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#006d6d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isSubmitting ? "Đang xác nhận..." : "Xác nhận email"}
            </button>

            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
            </button>
          </div>
        ) : null}

        <div className="mt-7 space-y-3">
          <Link
            href="/auth/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[#008080] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#006d6d]"
          >
            Đến trang đăng nhập
          </Link>
          <Link href="/" className="block text-center text-sm font-semibold text-slate-600 hover:text-slate-900">
            Về trang chủ
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

function normalizeStatus(value: string | null): keyof typeof STATUS_CONTENT {
  if (value === "success" || value === "error" || value === "sent") {
    return value;
  }
  return "sent";
}
