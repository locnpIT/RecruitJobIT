"use client";

import { TopCompanyCard } from "./top-companies/TopCompanyCard";
import { TopCompaniesStates } from "./top-companies/TopCompaniesStates";
import { useTopCompanies } from "./hooks/useTopCompanies";

export function TopCompaniesSection() {
  const { companies, marqueeCompanies, isLoading } = useTopCompanies();

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Doanh nghiệp tuyển dụng hàng đầu</h2>
        </div>

        <TopCompaniesStates loading={isLoading} empty={!isLoading && companies.length === 0} />

        {!isLoading && companies.length > 0 ? (
          <div className="top-companies-marquee overflow-hidden">
            <div className="top-companies-marquee__track flex w-max gap-3">
              {marqueeCompanies.map((company, index) => (
                <TopCompanyCard key={`${company.id}-${index}`} company={company} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
