"use client";

import { useEffect, useMemo, useState } from "react";
import { publicCompanyService } from "@/services/public-company.service";
import type { CompanyItem } from "./types";
import { TopCompanyCard } from "./top-companies/TopCompanyCard";
import { TopCompaniesStates } from "./top-companies/TopCompaniesStates";
import { buildMarqueeCompanies } from "./top-companies/utils";

export function TopCompaniesSection() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // API backend đã lọc sẵn các công ty đủ điều kiện:
    // - công ty APPROVED
    // - có tin tuyển dụng public còn hiệu lực
    // - có gói đăng bài ACTIVE + thanh toán thành công + còn thời hạn
    publicCompanyService
      .listTopCompanies(8)
      .then((data) => {
        if (isMounted) {
          setCompanies(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Nếu API lỗi thì trả empty-state rõ ràng, không giữ dữ liệu stale.
          setCompanies([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const marqueeCompanies = useMemo(() => buildMarqueeCompanies(companies, 8), [companies]);

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
