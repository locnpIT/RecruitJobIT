"use client";

import { PencilLine, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { AdminPackage } from "@/services/admin.service";

// Bảng danh mục gói dịch vụ của admin.
// Hiển thị toàn bộ package hiện có và phát action sửa/xóa về container cha.
type PackageTableProps = {
  packages: AdminPackage[];
  onEdit: (pkg: AdminPackage) => void;
  onDelete: (pkg: AdminPackage) => void;
};

export function PackageTable({ packages, onEdit, onDelete }: PackageTableProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Danh sách gói dịch vụ</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-medium">Tên gói</th>
              <th className="pb-2 font-medium">Mã</th>
              <th className="pb-2 font-medium">Giá</th>
              <th className="pb-2 font-medium">Thời hạn</th>
              <th className="pb-2 font-medium">Số lượt đăng ký</th>
              <th className="pb-2 font-medium">Trạng thái</th>
              <th className="pb-2 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {!packages.length ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Chưa có gói nào.
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id ?? pkg.maGoi} className="border-b border-slate-100 last:border-none">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{pkg.tenGoi ?? "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{pkg.maGoi ?? "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{formatMoney(pkg.giaNiemYet)}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{pkg.soNgayHieuLuc ? `${pkg.soNgayHieuLuc} ngày` : "--"}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{pkg.soCongTyDangSuDung ?? 0}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Đang hoạt động
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(pkg)}>
                        <PencilLine className="mr-1 h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={(pkg.soCongTyDangSuDung ?? 0) > 0}
                        onClick={() => onDelete(pkg)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
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

function formatMoney(value: number | null) {
  if (value == null) {
    return "--";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
