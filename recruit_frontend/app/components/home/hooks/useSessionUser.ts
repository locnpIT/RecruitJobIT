"use client";

import { useEffect, useMemo, useState } from "react";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";
import type { LocalUser } from "./types";

// Đọc session từ localStorage, trả về thông tin user và các derived state (role, tên hiển thị).
export function useSessionUser() {
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        if (!token || (expiresAt !== null && expiresAt <= Date.now())) {
          clearAdminSession();
          setUser(null);
          return;
        }
        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as LocalUser) : null);
      } catch {
        clearAdminSession();
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const role = user?.vaiTro?.toUpperCase() ?? null;
  const isCandidate = role === "USER";

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.ho ?? ""} ${user.ten ?? ""}`.trim() || user.email;
  }, [user]);

  const userInitial = useMemo(() => {
    const fallback = (user?.email ?? "U").trim();
    const source = (user?.ten ?? user?.ho ?? fallback).trim();
    return source.charAt(0).toUpperCase();
  }, [user]);

  return { user, role, isCandidate, fullName, userInitial };
}
