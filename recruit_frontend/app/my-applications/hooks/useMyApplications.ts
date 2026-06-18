"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import {
  candidateApplicationService,
  type CandidateJobApplication,
} from "@/services/candidate/candidate-application.service";

type LocalUser = {
  vaiTro?: string;
};

export function useMyApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState<CandidateJobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? (JSON.parse(rawUser) as LocalUser) : null;

        if (!token || (expiresAt !== null && expiresAt <= Date.now()) || user?.vaiTro?.toUpperCase() !== "USER") {
          clearAdminSession();
          router.replace("/auth/login");
          return;
        }

        setSessionChecked(true);
      } catch {
        clearAdminSession();
        router.replace("/auth/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) return;

    let isMounted = true;

    candidateApplicationService
      .listMyApplications()
      .then((data) => {
        if (!isMounted) return;
        setApplications(data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Không tải được danh sách đơn ứng tuyển.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionChecked]);

  const handleWithdraw = async (applicationId: number) => {
    setWithdrawingId(applicationId);
    try {
      await candidateApplicationService.withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      toast.success("Đã rút đơn ứng tuyển thành công.");
    } catch {
      toast.error("Không thể rút đơn. Chỉ rút được khi đơn ở trạng thái Chờ xử lý hoặc Đang xem xét.");
    } finally {
      setWithdrawingId(null);
    }
  };

  return {
    applications,
    isLoading,
    error,
    withdrawingId,
    handleWithdraw,
  };
}
