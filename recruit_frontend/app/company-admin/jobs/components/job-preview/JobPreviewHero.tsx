"use client";

import Image from "next/image";
import { CalendarClock, MapPin, Users } from "lucide-react";
import type { CompanyAdminCompany, CompanyAdminJob } from "@/services/company-admin/types";
import { formatDate } from "./formatters";

type JobPreviewHeroProps = {
  job: CompanyAdminJob;
  company: CompanyAdminCompany | null;
};

export function JobPreviewHero({ job, company }: JobPreviewHeroProps) {
  const companyName = job.congTyTen ?? company?.ten ?? "Công ty";
  const tags = [
    job.nganhNgheTen,
    job.capDoKinhNghiemTen,
    job.loaiHinhLamViecTen,
    job.id ? `JOB-${job.id}` : null,
  ].filter(Boolean);

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="absolute inset-0 bg-[url('/background-job-detail-1.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-white/65" />
      <div className="relative grid gap-8 px-5 py-8 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {job.trangThai ?? "Đang hiển thị"}
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-slate-950 md:text-5xl">
            {job.tieuDe ?? "Tin tuyển dụng"}
          </h1>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {companyName}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {job.chiNhanhTen ?? "Chi nhánh"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Hạn nộp: {formatDate(job.denHanLuc) ?? "--"}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white/95 lg:grid lg:place-items-center">
          {company?.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`Logo ${companyName}`}
              width={288}
              height={176}
              className="h-44 w-72 object-contain p-6"
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-2xl bg-slate-900 text-3xl font-bold text-white">
              {companyName.slice(0, 1)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

