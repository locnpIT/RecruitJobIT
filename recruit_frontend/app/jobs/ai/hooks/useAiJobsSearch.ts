"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  publicJobService,
  type PublicJobSearchResponse,
  type PublicJobSummary,
} from "@/services/public/public-job.service";

const AI_SEARCH_LIMIT = 12;

// Hook riêng cho `/jobs/ai`: chỉ nhận prompt và gọi endpoint AI, không dùng filter/pagination của `/jobs`.
export function useAiJobsSearch() {
  const searchParams = useSearchParams();
  const prompt = useMemo(() => searchParams.get("prompt")?.trim() ?? "", [searchParams]);
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [searchState, setSearchState] = useState<PublicJobSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(prompt));
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAiSearch = async () => {
      if (!prompt) {
        setIsLoading(false);
        setSearchState(null);
        setJobs([]);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const data = await publicJobService.aiSearchJobs({
          prompt,
          gioiHan: AI_SEARCH_LIMIT,
        });
        if (!isMounted) {
          return;
        }
        setSearchState(data);
        setJobs(data.danhSach ?? []);
      } catch {
        if (!isMounted) {
          return;
        }
        setError("Không tìm kiếm AI được lúc này. Vui lòng thử lại.");
        setSearchState(null);
        setJobs([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAiSearch();

    return () => {
      isMounted = false;
    };
  }, [prompt]);

  return {
    prompt,
    jobs,
    searchState,
    isLoading,
    error,
  };
}
