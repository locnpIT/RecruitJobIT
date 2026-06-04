import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";

// Trạng thái loading ban đầu của màn profile khi chưa có session user.
export function ProfileLoadingState() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="flex-1 mx-auto flex w-full max-w-6xl items-center justify-center px-4">
        <p className="text-sm text-slate-600">Đang tải hồ sơ...</p>
      </main>
      <HomeFooter />
    </div>
  );
}
