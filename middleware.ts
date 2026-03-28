import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_REFRESH_COOKIE_NAME,
  createSupabaseServerClient,
  isAdminUser,
} from "@/app/lib/supabase";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/api/public") || pathname.startsWith("/api/cron");
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(AUTH_ACCESS_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });
  response.cookies.set(AUTH_REFRESH_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });
}

function applyAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn?: number
): void {
  response.cookies.set(
    AUTH_ACCESS_COOKIE_NAME,
    accessToken,
    getCookieOptions(expiresIn ?? ACCESS_TOKEN_MAX_AGE)
  );
  response.cookies.set(
    AUTH_REFRESH_COOKIE_NAME,
    refreshToken,
    getCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (request.nextUrl.pathname !== "/login") {
    loginUrl.searchParams.set("next", nextPath);
  }

  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value ?? null;
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE_NAME)?.value ?? null;
  const supabase = createSupabaseServerClient();

  let currentAccessToken = accessToken;
  let currentRefreshToken = refreshToken;
  let currentUser = null;
  let refreshedExpiresIn: number | undefined;

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error) {
      currentUser = data.user;
    }
  }

  if (!currentUser && refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!error && data.session) {
      currentAccessToken = data.session.access_token;
      currentRefreshToken = data.session.refresh_token;
      refreshedExpiresIn = data.session.expires_in;

      const { data: refreshedUserData, error: refreshedUserError } = await supabase.auth.getUser(
        data.session.access_token
      );

      if (!refreshedUserError) {
        currentUser = refreshedUserData.user;
      }
    }
  }

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && currentUser && isAdminUser(currentUser)) {
      const response = NextResponse.redirect(new URL("/", request.url));

      if (currentAccessToken && currentRefreshToken) {
        applyAuthCookies(response, currentAccessToken, currentRefreshToken, refreshedExpiresIn);
      }

      return response;
    }

    const response = NextResponse.next();

    if (
      currentAccessToken &&
      currentRefreshToken &&
      (currentAccessToken !== accessToken || currentRefreshToken !== refreshToken)
    ) {
      applyAuthCookies(response, currentAccessToken, currentRefreshToken, refreshedExpiresIn);
    }

    return response;
  }

  if (!currentUser || !isAdminUser(currentUser)) {
    return redirectToLogin(request);
  }

  const response = NextResponse.next();

  if (
    currentAccessToken &&
    currentRefreshToken &&
    (currentAccessToken !== accessToken || currentRefreshToken !== refreshToken)
  ) {
    applyAuthCookies(response, currentAccessToken, currentRefreshToken, refreshedExpiresIn);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
