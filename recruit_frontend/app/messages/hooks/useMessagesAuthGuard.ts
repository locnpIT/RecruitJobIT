"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, getJwtExpiryMs } from "@/lib/admin-session";

type LocalUser = { id: number; vaiTro: string };

// Kiểm tra token + system role USER, redirect nếu không hợp lệ.
// Trả về ready=true và currentUserId khi auth thành công.
export function useMessagesAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (!mounted) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const expiresAt = token ? getJwtExpiryMs(token) : null;
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? (JSON.parse(rawUser) as LocalUser) : null;
        const isCandidate = user?.vaiTro?.toUpperCase() === "USER";

        if (!token || (expiresAt !== null && expiresAt <= Date.now()) || !isCandidate) {
          clearAdminSession();
          router.replace("/auth/login?redirect=/messages");
          return;
        }

        setCurrentUserId(typeof user?.id === "number" ? user.id : null);
        setReady(true);
      } catch {
        clearAdminSession();
        router.replace("/auth/login?redirect=/messages");
      }
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  return { ready, currentUserId };
}
