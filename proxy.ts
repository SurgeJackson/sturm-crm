import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth/");
  const isLoginPage = pathname === "/login" || pathname === "/auth/login";
  const hasAuthError = request.nextUrl.searchParams.has("error");
  const tokenCanEnterCrm = Boolean(token && token.isActive !== false && token.emailVerifiedAt !== null);

  if (pathname.startsWith("/uploads/proposals/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!token && !isAuthPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isLoginPage && tokenCanEnterCrm && !hasAuthError) {
    return NextResponse.redirect(new URL("/", request.url));
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

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
