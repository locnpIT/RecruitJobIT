export function setAuthCookie(token: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") {
    return;
  }

  const safeMaxAge = Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0 ? Math.floor(maxAgeSeconds) : 60 * 60;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${safeMaxAge}; samesite=lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}
