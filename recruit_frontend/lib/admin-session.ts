import { clearAuthCookie } from "@/lib/auth-cookie";

export function clearAdminSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  clearAuthCookie();
}

export function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload?.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

