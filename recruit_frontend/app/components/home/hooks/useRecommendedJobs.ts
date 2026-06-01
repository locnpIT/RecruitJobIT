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
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRecommendedJobs = async () => {
      // QA rule: chưa đăng nhập hoặc không phải candidate thì không gọi API và không render section.
      if (!readCandidateSession()) {
        setJobs([]);
        setShouldRender(false);
        return;
      }

      try {
        // Nếu candidate chưa tạo hồ sơ thì không có dữ liệu cá nhân hóa,
        // nên không gọi matching và không render "Việc làm phù hợp với tôi".
        const profiles = await candidateProfileService.listProfiles();
        if (!active) {
          return;
        }
        if (!profiles || profiles.length === 0) {
          setJobs([]);
          setShouldRender(false);
          return;
        }

        const data = await candidateProfileService.listRecommendedJobs(RECOMMENDED_JOBS_LIMIT);
        if (active) {
          const recommendedJobs = data ?? [];
          setJobs(recommendedJobs);
          setShouldRender(recommendedJobs.length > 0);
        }
      } catch {
        if (active) {
          setJobs([]);
          setShouldRender(false);
        }
      }
    };

    void loadRecommendedJobs();
    return () => {
      active = false;
    };
  }, []);

  return { jobs, shouldRender };
}
