import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth/");
  const isLoginPage = pathname === "/login" || pathname === "/auth/login";
  const isApiRoute = pathname.startsWith("/api/");
  const isLocationDisplayPage = pathname === "/location-display" || pathname.startsWith("/location-display/");
  const hasAuthError = request.nextUrl.searchParams.has("error");
  const tokenCanEnterCrm = Boolean(token && token.isActive !== false && token.emailVerifiedAt !== null);

  if (pathname.startsWith("/uploads/proposals/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!token && !isAuthPage && !isApiRoute && !isLocationDisplayPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isLoginPage && tokenCanEnterCrm && !hasAuthError) {
    return NextResponse.redirect(new URL(getSafeCallbackPath(request), request.url));
  }

  if (token && token.emailVerifiedAt === null && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/resend-verification", request.url));
  }

  if (token && token.isActive === false && !isAuthPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "USER_NOT_ACTIVE");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/settings") && token?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function getSafeCallbackPath(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  if (!callbackUrl) return "/";
  if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) return callbackUrl;

  try {
    const url = new URL(callbackUrl);
    if (url.origin === request.nextUrl.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/";
  }

  return "/";
}

export const config = {
  matcher: ["/((?!api/auth|_next|favicon.ico).*)"]
};
