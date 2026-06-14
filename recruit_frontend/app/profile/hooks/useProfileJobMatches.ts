"use client";

import { useEffect, useState } from "react";
import {
  candidateProfileService,
  type CandidateRecommendedJob,
} from "@/services/candidate/candidate-profile.service";

export function useProfileJobMatches(activeProfileId: number | null) {
  const [jobs, setJobs] = useState<CandidateRecommendedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeProfileId) {
      setJobs([]);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    candidateProfileService
      .listJobMatchesByProfile(activeProfileId)
      .then((data) => {
        if (active) {
          setJobs(data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setError("Không tải được danh sách việc làm phù hợp.");
          setJobs([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeProfileId]);

  return { jobs, loading, error };
}
