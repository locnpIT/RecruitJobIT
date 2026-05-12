"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  companyAdminService,
  type CompanyAdminBranch,
  type CompanyAdminMeResponse,
} from "@/services/company-admin.service";
import { isCompanyApproved } from "./company-admin-status";
import { CompanyAdminRestrictedNotice } from "./components/CompanyAdminRestrictedNotice";

/**
 * Trang tổng quan doanh nghiệp.
 * Đây là nơi hiển thị snapshot nhanh về công ty, chi nhánh và trạng thái gói/quyền đăng bài.
 */
export default function CompanyAdminHomePage() {
  const [data, setData] = useState<CompanyAdminMeResponse | null>(null);
  const [branches, setBranches] = useState<CompanyAdminBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    companyAdminService
      .getMe()
      .then(async (response) => {
        if (!active) return;
        setData(response);

        // Chỉ tải danh sách chi nhánh đầy đủ khi công ty đã được duyệt và có quyền sử dụng dashboard.
        if (isCompanyApproved(response.congTy.trangThai)) {
          const responseBranches = await companyAdminService.getBranches();
          if (!active) return;
          setBranches(responseBranches);
        } else {
          setBranches([]);
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Không tải được dữ liệu công ty.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-rose-200 px-4 py-3 text-rose-700">
        {error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  const visibleBranches = branches.length > 0 ? branches : data.chiNhanhs ?? [];
  const branchCount = visibleBranches.length;
  const primaryBranch = visibleBranches.find((branch) => branch.laTruSoChinh) ?? visibleBranches[0] ?? null;
  const companyLogo = data.congTy.logoUrl ?? null;
  const companyApproved = isCompanyApproved(data.congTy.trangThai);
  const companyRejected = data.congTy.trangThai?.toUpperCase() === "REJECTED";
  const companyCanPostJobs = Boolean(data.congTy.coQuyenDangBai);

  return (
    <div className="space-y-6 text-slate-900">
      <header className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company Admin</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.congTy.ten ?? "Công ty chưa có tên"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.congTy.trangThai ?? "--"} · {branchCount} chi nhánh · chi nhánh chính: {primaryBranch?.chiNhanhTen ?? "--"}
        </p>
      </header>

      {!companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={companyRejected ? "Công ty đã bị từ chối" : "Công ty đang chờ duyệt"}
          tone={companyRejected ? "danger" : "success"}
          description={
            companyRejected
              ? `Lý do từ chối: ${data.congTy.lyDoTuChoi ?? "Chưa có lý do"}. Bạn có thể vào mục Tuỳ chỉnh để cập nhật logo và gửi duyệt lại.`
              : "Công ty đang chờ duyệt. Hiện chỉ có thể cập nhật logo ở mục Tuỳ chỉnh."
          }
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Thông tin chung
          </h2>
          <dl className="divide-y divide-slate-200 text-sm">
            <LineRow label="Tài khoản" value={data.nguoiDung.email ?? "--"} />
            <LineRow label="Mã số thuế" value={data.congTy.maSoThue ?? "--"} />
            <LineRow label="Website" value={data.congTy.website ?? "--"} />
            <LineRow
              label="Gói đăng bài"
              value={
                companyCanPostJobs
                  ? `${data.congTy.goiDangBaiTen ?? "Đang hoạt động"}${data.congTy.goiDangBaiHetHanLuc ? `, hết hạn ${new Date(data.congTy.goiDangBaiHetHanLuc).toLocaleString("vi-VN")}` : ""}`
                  : "Chưa có gói hoạt động"
              }
            />
            <LineRow label="Logo" value={companyLogo ? "Đã có" : "Chưa có"} />
          </dl>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Logo
          </h2>
          <div className="pt-4">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogo} alt="Logo công ty" className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50 object-contain p-1" />
            ) : (
              <div className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50" />
            )}
            <p className="mt-2 text-sm text-slate-600">{companyLogo ? "Đã cập nhật" : "Chưa có logo"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Chi nhánh
        </h2>
        {visibleBranches.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Chưa có chi nhánh nào được trả về từ hệ thống.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Tên</th>
                  <th className="py-2 font-medium">Vai trò</th>
                  <th className="py-2 font-medium">Trạng thái</th>
                  <th className="py-2 font-medium">Chi nhánh chính</th>
                  <th className="py-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody>
                {visibleBranches.map((branch) => (
                  <tr key={branch.chiNhanhId ?? branch.chiNhanhTen} className="border-b border-slate-200">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{branch.chiNhanhTen ?? "--"}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{branch.vaiTroCongTy ?? "--"}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{branch.trangThai ?? "--"}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{branch.laTruSoChinh ? "Có" : "Không"}</td>
                    <td className="py-2.5 text-slate-600">{branch.chiNhanhId ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Dòng hiển thị key/value cho phần thông tin công ty.
 * Tách riêng để tránh lặp markup trong khối `dl`.
 */
function LineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
