"use client";

import { useEffect, useState } from "react";
import { publicCompanyService, type PublicCompanyDetail } from "@/services/public-company.service";
import type { PublicJobSummary } from "@/services/public-job.service";

// Dùng cho màn /companies/[id]: nạp profile công ty public và danh sách job public của công ty.
export function usePublicCompanyData(companyId: string) {
  const [company, setCompany] = useState<PublicCompanyDetail | null>(null);
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      publicCompanyService.getCompanyDetail(companyId),
      publicCompanyService.listCompanyJobs(companyId, 12),
    ])
      .then(([companyData, jobsData]) => {
        if (!isMounted) {
          return;
        }
        setCompany(companyData);
        setJobs(jobsData);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setError("Không tìm thấy công ty hoặc công ty chưa có dữ liệu public.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  return {
    company,
    jobs,
    loading,
    error,
  };
}
