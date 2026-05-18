"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import type { LocalUser } from "./types";

// Kiểm tra session candidate trước khi cho phép dùng trang profile.
export function useCandidateProfileSession() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

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
    if (!sessionChecked) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.vaiTro?.toUpperCase() !== "CANDIDATE") {
      router.replace("/");
    }
  }, [router, sessionChecked, user]);

  return {
    user,
    setUser,
    sessionChecked,
  };
}
