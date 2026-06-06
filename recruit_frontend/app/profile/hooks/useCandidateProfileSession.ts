"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import { companyAdminSettingsService } from "@/services/company-admin/settings.service";
import type { LocalUser } from "./types";

// Kiểm tra session trước khi cho phép dùng trang thông tin cá nhân.
export function useCandidateProfileSession() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [accountTypeChecked, setAccountTypeChecked] = useState(false);
  const [isCandidateAccount, setIsCandidateAccount] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setUser(null);
          setSessionChecked(true);
          router.replace("/auth/login");
          return;
        }

        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as LocalUser) : null);
        setSessionChecked(true);
      } catch {
        clearAdminSession();
        setUser(null);
        setSessionChecked(true);
        router.replace("/auth/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (sessionChecked && !user) {
      router.replace("/auth/login");
    }
  }, [router, sessionChecked, user]);

  useEffect(() => {
    if (!sessionChecked || !user) {
      return;
    }

    let isMounted = true;
    const resolveAccountType = async () => {
      if (user.vaiTro?.toUpperCase() !== "CANDIDATE") {
        if (isMounted) {
          setIsCandidateAccount(false);
          setAccountTypeChecked(true);
        }
        return;
      }

      try {
        await companyAdminSettingsService.getMe();
        if (isMounted) {
          // Owner và HR dùng chung system role CANDIDATE nhưng có membership công ty.
          setIsCandidateAccount(false);
        }
      } catch (error) {
        if (isMounted) {
          // API trả 403 khi user không có membership công ty; lỗi khác giữ fail-closed.
          const hasNoCompanyMembership = axios.isAxiosError(error) && error.response?.status === 403;
          setIsCandidateAccount(hasNoCompanyMembership);
        }
      } finally {
        if (isMounted) {
          setAccountTypeChecked(true);
        }
      }
    };

    void resolveAccountType();
    return () => {
      isMounted = false;
    };
  }, [sessionChecked, user]);

  return {
    user,
    setUser,
    sessionChecked,
    accountTypeChecked,
    isCandidateAccount,
  };
}
