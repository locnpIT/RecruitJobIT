"use client";

import { useEffect, useState } from "react";
import { publicCompanyService, type PublicCompanyDetail } from "@/services/public/public-company.service";
import type { PublicJobSummary } from "@/services/public/public-job.service";

// Dùng cho màn /companies/[id]: nạp profile công ty public và danh sách job public của công ty.
export function usePublicCompanyData(companyId: string) {
  const hasValidCompanyId = companyId.trim().length > 0;
  const [company, setCompany] = useState<PublicCompanyDetail | null>(null);
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidCompanyId) {
      return;
    }

    let isMounted = true;

    publicCompanyService.getCompanyDetail(companyId)
      .then((companyData) => {
        if (!isMounted) {
          return;
        }
        setCompany(companyData);
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
  }, [companyId, hasValidCompanyId]);

  useEffect(() => {
    if (!hasValidCompanyId || !company) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    publicCompanyService.listCompanyJobs(companyId, 30, selectedBranchId ?? undefined)
      .then((jobsData) => {
        if (isMounted) {
          setJobs(jobsData);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Không thể tải danh sách tin tuyển dụng của công ty.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [company, companyId, hasValidCompanyId, selectedBranchId]);

  return {
    company,
    jobs,
    selectedBranchId,
    setSelectedBranchId,
    loading: hasValidCompanyId ? loading : false,
    error: hasValidCompanyId ? error : "Không tìm thấy công ty hoặc công ty chưa có dữ liệu public.",
  };
}
