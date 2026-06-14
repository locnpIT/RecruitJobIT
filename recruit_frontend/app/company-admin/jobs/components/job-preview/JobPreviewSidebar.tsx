"use client";

import Image from "next/image";
import type { CompanyAdminCompany, CompanyAdminJob } from "@/services/company-admin/types";
import { formatSalary } from "./formatters";

type JobPreviewSidebarProps = {
  job: CompanyAdminJob;
  company: CompanyAdminCompany | null;
};

export function JobPreviewSidebar({ job, company }: JobPreviewSidebarProps) {
  const companyName = job.congTyTen ?? company?.ten ?? "Công ty";
  const branchNames = (job.chiNhanhs ?? [])
    .map((branch) => branch.chiNhanhTen)
    .filter(Boolean)
    .join(", ");

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex gap-4">
          {company?.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`Logo ${companyName}`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-slate-200 object-contain p-1"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg font-bold text-white">
              {companyName.slice(0, 1)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-950">{companyName}</h3>
            <p className="mt-2 text-sm text-slate-600">{company?.website ?? "Website chưa cập nhật"}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">{company?.moTa ?? "Mô tả công ty chưa cập nhật."}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-950">Tổng quan tuyển dụng</p>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>Lương: {formatSalary(job)}</p>
          <p>Chi nhánh: {branchNames || "--"}</p>
          <p>Mẫu CV: {job.batBuocCV ? "Bắt buộc" : "Không bắt buộc"}</p>
        </div>
      </section>
    </aside>
  );
}
