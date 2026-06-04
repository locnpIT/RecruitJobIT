import Image from "next/image";
import { Briefcase, Building2, Globe2 } from "lucide-react";
import type { PublicCompanyDetail } from "@/services/public/public-company.service";

type PublicCompanyHeaderProps = {
  company: PublicCompanyDetail;
};

// Header thông tin công ty ở trang public company detail.
// Tách riêng để page chính tập trung vào orchestration data + render list jobs.
export function PublicCompanyHeader({ company }: PublicCompanyHeaderProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`Logo ${company.ten}`}
              width={80}
              height={80}
              className="h-20 w-20 object-contain p-2"
            />
          ) : (
            <Building2 className="h-8 w-8 text-slate-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">{company.ten}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-slate-400" />
              {company.soTinDang > 0
                ? `${company.soTinDang} tin tuyển dụng đang mở`
                : "Chưa có tin tuyển dụng"}
            </span>
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <Globe2 className="h-4 w-4 text-slate-400" />
                {company.website}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {company.moTa ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{company.moTa}</p>
      ) : null}
    </article>
  );
}

