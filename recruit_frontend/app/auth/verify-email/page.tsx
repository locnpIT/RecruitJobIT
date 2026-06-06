import Link from "next/link";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { AuthCard, AuthLayout } from "../components/AuthLayout";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    status?: string;
    email?: string;
  }>;
};

const STATUS_CONTENT = {
  sent: {
    icon: Mail,
    title: "Kiểm tra email của bạn",
    description: "Hệ thống đã gửi link xác nhận. Vui lòng mở email và bấm xác nhận để kích hoạt tài khoản.",
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
    description: "Link xác nhận không hợp lệ hoặc tài khoản không còn tồn tại. Vui lòng kiểm tra lại email đã nhận.",
    tone: "text-rose-700 bg-rose-50 border-rose-100",
  },
} as const;

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const status = normalizeStatus(params?.status);
  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${content.tone}`}>
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">{content.title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{content.description}</p>
          {status === "sent" && params?.email ? (
            <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {params.email}
            </p>
          ) : null}
        </div>

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

function normalizeStatus(value?: string): keyof typeof STATUS_CONTENT {
  if (value === "success" || value === "error" || value === "sent") {
    return value;
  }
  return "sent";
}
