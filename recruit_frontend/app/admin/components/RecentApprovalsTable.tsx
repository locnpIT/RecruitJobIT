import Link from "next/link";
import type { DuyetGanDayItem } from "../types";
import { StatusPill } from "./StatusPill";

// Bảng tóm tắt công ty đăng ký gần đây trên dashboard admin.
// Giúp admin nhìn nhanh các hồ sơ công ty mới cần kiểm tra.
type RecentApprovalsTableProps = {
  rows: DuyetGanDayItem[];
};

export function RecentApprovalsTable({ rows }: RecentApprovalsTableProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Công ty đăng ký gần đây</h2>
        <Link href="/admin/companies" className="text-sm font-medium text-blue-700 hover:underline">
          Xem danh sách
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-medium">Công ty</th>
              <th className="pb-2 font-medium">Người phụ trách</th>
              <th className="pb-2 font-medium">Trạng thái</th>
              <th className="pb-2 font-medium">Ngày gửi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.ten}-${row.congTy}`} className="border-b border-slate-100 last:border-none">
                <td className="py-2.5 font-medium text-slate-800">{row.ten}</td>
                <td className="py-2.5 text-slate-600">{row.congTy}</td>
                <td className="py-2.5">
                  <StatusPill value={row.trangThai} />
                </td>
                <td className="py-2.5 text-slate-500">{row.ngay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
