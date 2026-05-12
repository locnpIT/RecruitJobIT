"use client";

import { StatusPill } from "../../components/StatusPill";
import type { AdminPackageSubscription } from "@/services/admin.service";

// Bảng đăng ký gói gần đây.
// Dùng để admin theo dõi công ty nào vừa mua/gia hạn gói và trạng thái hiệu lực tương ứng.
type PackageSubscriptionsTableProps = {
  subscriptions: AdminPackageSubscription[];
};

export function PackageSubscriptionsTable({ subscriptions }: PackageSubscriptionsTableProps) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-950">Đăng ký gần đây</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 font-medium">Công ty</th>
              <th className="pb-3 font-medium">Gói</th>
              <th className="pb-3 font-medium">Bắt đầu</th>
              <th className="pb-3 font-medium">Hết hạn</th>
              <th className="pb-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {!subscriptions.length ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  Chưa có đăng ký nào.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id ?? `${sub.congTy}-${sub.goi}`} className="border-b border-slate-100 last:border-none">
                  <td className="py-3 pr-4 font-medium text-slate-900">{sub.congTy ?? "--"}</td>
                  <td className="py-3 pr-4 text-slate-700">{sub.goi ?? "--"}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDate(sub.batDauLuc)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatDate(sub.hetHanLuc)}</td>
                  <td className="py-3">
                    <StatusPill value={sub.coHieuLuc ? "ACTIVE" : sub.trangThai ?? "INACTIVE"} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString("vi-VN");
}
