import Link from "next/link";
import Image from "next/image";

// Footer public dùng lại cho trang chủ, auth và profile.
// Mục tiêu là giữ cảm giác hệ thống nhất quán khi người dùng đi qua các route public.
export function HomeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="relative h-[52px] w-[250px] overflow-hidden">
            <Image
              src="/logo-web-recruit-header.png"
              alt="Recruit logo"
              fill
              sizes="250px"
              className="object-cover object-center"
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Nền tảng kết nối ứng viên và doanh nghiệp, tập trung vào trải nghiệm tuyển dụng rõ ràng và đáng tin cậy.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Dành cho ứng viên</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li><Link href="/auth/register/candidate" className="hover:underline">Tạo hồ sơ ứng viên</Link></li>
            <li><Link href="/auth/login" className="hover:underline">Đăng nhập tài khoản</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Dành cho doanh nghiệp</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li><Link href="/auth/register/owner" className="hover:underline">Đăng ký nhà tuyển dụng</Link></li>
            <li><Link href="/auth/login" className="hover:underline">Quản lý tin tuyển dụng</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500">
          <span>© 2026 Recruit Platform</span>
          <span>Build for practical hiring workflow</span>
        </div>
      </div>
    </footer>
  );
}
