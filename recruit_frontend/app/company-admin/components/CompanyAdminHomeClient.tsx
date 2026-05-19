"use client";

import { Loader2 } from "lucide-react";
import { CompanyAdminRestrictedNotice } from "./CompanyAdminRestrictedNotice";
import { useCompanyAdminHomeData } from "../hooks/useCompanyAdminHomeData";

// Client container cho trang /company-admin.
export function CompanyAdminHomeClient() {
  const data = useCompanyAdminHomeData();

  if (data.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (data.error || !data.data) {
    return (
      <div className="border border-rose-200 px-4 py-3 text-rose-700">
        {data.error ?? "Không có dữ liệu công ty."}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <header className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company Admin</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.data.congTy.ten ?? "Công ty chưa có tên"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.data.congTy.trangThai ?? "--"} · {data.branchCount} chi nhánh · chi nhánh chính: {data.primaryBranch?.chiNhanhTen ?? "--"}
        </p>
      </header>

      {!data.companyApproved ? (
        <CompanyAdminRestrictedNotice
          title={data.companyRejected ? "Công ty đã bị từ chối" : "Công ty đang chờ duyệt"}
          tone={data.companyRejected ? "danger" : "success"}
          description={
            data.companyRejected
              ? `Lý do từ chối: ${data.data.congTy.lyDoTuChoi ?? "Chưa có lý do"}. Bạn có thể vào mục Tuỳ chỉnh để cập nhật logo và gửi duyệt lại.`
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
            <LineRow label="Tài khoản" value={data.data.nguoiDung.email ?? "--"} />
            <LineRow label="Mã số thuế" value={data.data.congTy.maSoThue ?? "--"} />
            <LineRow label="Website" value={data.data.congTy.website ?? "--"} />
            <LineRow
              label="Gói đăng bài"
              value={
                data.companyCanPostJobs
                  ? `${data.data.congTy.goiDangBaiTen ?? "Đang hoạt động"}${data.data.congTy.goiDangBaiHetHanLuc ? `, hết hạn ${new Date(data.data.congTy.goiDangBaiHetHanLuc).toLocaleString("vi-VN")}` : ""}`
                  : "Chưa có gói hoạt động"
              }
            />
            <LineRow label="Logo" value={data.companyLogo ? "Đã có" : "Chưa có"} />
          </dl>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Logo
          </h2>
          <div className="pt-4">
            {data.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.companyLogo} alt="Logo công ty" className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50 object-contain p-1" />
            ) : (
              <div className="h-20 w-20 rounded-md border border-slate-200 bg-slate-50" />
            )}
            <p className="mt-2 text-sm text-slate-600">{data.companyLogo ? "Đã cập nhật" : "Chưa có logo"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Chi nhánh
        </h2>
        {data.visibleBranches.length === 0 ? (
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
                {data.visibleBranches.map((branch) => (
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

function LineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
