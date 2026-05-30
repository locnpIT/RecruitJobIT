import Image from "next/image";
import { Building2, Globe2 } from "lucide-react";
import type { PublicCompanyDetail } from "@/services/public/public-company.service";

type PublicCompanyHeaderProps = {
  company: PublicCompanyDetail;
};

// Header thông tin công ty ở trang public company detail.
// Tách riêng để page chính tập trung vào orchestration data + render list jobs.
export function PublicCompanyHeader({ company }: PublicCompanyHeaderProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
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
          <p className="mt-1 text-sm text-slate-600">Đang có {company.soTinDang} tin tuyển dụng public.</p>
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:underline"
            >
              <Globe2 className="h-4 w-4" />
              {company.website}
            </a>
          ) : null}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{company.moTa}</p>
    </article>
  );
}

