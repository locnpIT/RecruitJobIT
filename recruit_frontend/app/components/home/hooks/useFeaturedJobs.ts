"use client";

import { useEffect, useState } from "react";
import { publicJobService, type PublicJobSummary } from "@/services/public/public-job.service";

// Dùng cho section FeaturedJobsSection ở homepage: nạp danh sách job public nổi bật.
export function useFeaturedJobs() {
  const [publicJobs, setPublicJobs] = useState<PublicJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    publicJobService
      .listJobs({ gioiHan: 4 })
      .then((data) => {
        if (isMounted) {
          setPublicJobs(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPublicJobs([]);
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

  return {
    publicJobs,
    isLoading,
  };
}
