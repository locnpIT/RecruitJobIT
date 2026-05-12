import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/company-admin/me`, {
      headers: {
        Authorization: `Bearer ${decodeURIComponent(token)}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      return NextResponse.next();
    }
  } catch {
    // fall through to redirect
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/company-admin/:path*"],
};
