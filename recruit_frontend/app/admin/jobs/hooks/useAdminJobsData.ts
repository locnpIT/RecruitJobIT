"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminJobsService } from "@/services/admin/jobs.service";
import type { AdminJob } from "@/services/admin/types";

// Dùng cho màn admin/jobs: state filter + tải danh sách tin tuyển dụng.
export function useAdminJobsData() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      company: company.trim() || undefined,
      status: status || undefined,
      industry: industry.trim() || undefined,
      location: location.trim() || undefined,
    }),
    [keyword, company, status, industry, location],
  );

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminJobsService.listJobs(filters);
      setJobs(data);
    } catch (err) {
      setError("Không tải được danh sách tin tuyển dụng.");
      setJobs([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  return {
    keyword,
    status,
    company,
    industry,
    location,
    setKeyword,
    setStatus,
    setCompany,
    setIndustry,
    setLocation,
    jobs,
    loading,
    error,
    loadJobs,
  };
}
