"use client";

import { useEffect, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import {
  candidateProfileService,
  type CandidateRecommendedJob,
} from "@/services/candidate/candidate-profile.service";

type LocalUser = {
  vaiTro?: string | null;
};

const RECOMMENDED_JOBS_LIMIT = 6;

function readCandidateSession(): boolean {
  try {
    const token = localStorage.getItem("token");
    const expiresAt = token ? getJwtExpiryMs(token) : null;
    if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
      clearAdminSession();
      return false;
    }

    const rawUser = localStorage.getItem("user");
    const user = rawUser ? (JSON.parse(rawUser) as LocalUser) : null;
    return user?.vaiTro?.toUpperCase() === "CANDIDATE";
  } catch {
    clearAdminSession();
    return false;
  }
}

export function useRecommendedJobs() {
  const [jobs, setJobs] = useState<CandidateRecommendedJob[]>([]);

  useEffect(() => {
    let active = true;

    const loadRecommendedJobs = async () => {
      // QA rule: chưa đăng nhập hoặc không phải candidate thì không gọi API và không render section.
      if (!readCandidateSession()) {
        setJobs([]);
        return;
      }

      try {
        const data = await candidateProfileService.listRecommendedJobs(RECOMMENDED_JOBS_LIMIT);
        if (active) {
          // Backend trả [] khi candidate chưa có hồ sơ; frontend giữ nguyên rule không render.
          setJobs(data ?? []);
        }
      } catch {
        if (active) {
          setJobs([]);
        }
      }
    };

    void loadRecommendedJobs();
    return () => {
      active = false;
    };
  }, []);

  return { jobs };
}
