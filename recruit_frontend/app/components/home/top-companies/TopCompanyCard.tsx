import Image from "next/image";
import Link from "next/link";
import type { CompanyItem } from "../types";
import { getCompanyInitials } from "./utils";

type TopCompanyCardProps = {
  company: CompanyItem;
};

// Card hiển thị tối giản đúng scope PM chốt: logo + tên công ty.
// Fallback initials giúp UI không vỡ nếu logoUrl trống hoặc link ảnh lỗi phía nguồn.
export function TopCompanyCard({ company }: TopCompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="block w-[260px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-white text-sm font-bold text-slate-700">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`Logo ${company.ten}`}
              width={48}
              height={48}
              sizes="48px"
              className="h-12 w-12 object-contain p-1"
            />
          ) : (
            getCompanyInitials(company.ten)
          )}
        </div>
        <p className="text-sm font-semibold leading-5 text-slate-900">{company.ten}</p>
      </div>
    </Link>
  );
}
