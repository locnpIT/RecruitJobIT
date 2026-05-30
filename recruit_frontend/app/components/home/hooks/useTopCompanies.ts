"use client";

import { useEffect, useMemo, useState } from "react";
import { publicCompanyService } from "@/services/public/public-company.service";
import type { CompanyItem } from "../types";
import { buildMarqueeCompanies } from "../top-companies/utils";

// Dùng cho TopCompaniesSection: nạp danh sách top companies và dựng marquee data.
export function useTopCompanies() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    publicCompanyService
      .listTopCompanies(8)
      .then((data) => {
        if (isMounted) {
          setCompanies(data);
        }
      })
      .catch(() => {
        if (isMounted) {
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

  return {
    companies,
    marqueeCompanies,
    isLoading,
  };
}
