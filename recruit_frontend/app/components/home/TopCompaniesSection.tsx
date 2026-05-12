import Link from "next/link";
import type { CompanyItem } from "./types";

// Section hiển thị nhóm công ty nổi bật trên homepage.
// Dữ liệu hiện đang đến từ mock data nhưng cấu trúc đã sẵn để thay bằng API thật.
function getCompanyInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type TopCompaniesSectionProps = {
  companies: CompanyItem[];
};

export function TopCompaniesSection({ companies }: TopCompaniesSectionProps) {
  const minimumVisibleCompanies = 8;
  const repeatedCompanies =
    companies.length === 0
      ? []
      : Array.from({ length: Math.ceil(minimumVisibleCompanies / companies.length) }, () => companies).flat();
  const baseCompanies = repeatedCompanies.slice(0, Math.max(minimumVisibleCompanies, companies.length));
  const marqueeCompanies = [...baseCompanies, ...baseCompanies];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Doanh nghiệp tuyển dụng hàng đầu</h2>
        </div>

        <div className="top-companies-marquee overflow-hidden">
          <div className="top-companies-marquee__track flex w-max gap-3">
            {marqueeCompanies.map((company, index) => (
              <article
                key={`${company.ten}-${index}`}
                className="w-[280px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-700">
                  {getCompanyInitials(company.ten)}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-5">{company.ten}</p>
                  <p className="text-xs text-slate-500">{company.linhVuc}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Đang tuyển: <span className="font-semibold text-slate-900">{company.dangTuyen} vị trí</span>
              </p>
                <p className="mt-1 text-xs text-slate-500">
                  Top {(index % Math.max(baseCompanies.length, 1)) + 1} doanh nghiệp tuần này
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
