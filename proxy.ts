import { type NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./app/(auth)/auth.config";
import { TOKEN_COOKIE_NAME } from "./lib/auth-token";

const { auth } = NextAuth(authConfig);

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith(`${base}/login`) ||
    pathname.startsWith(`${base}/register`);

  // Primary auth check: NextAuth session (JWT cookie set by next-auth)
  const hasNextAuthSession = !!req.auth;

  // Secondary check: our backend JWT cookie also present?
  // This lets us detect cases where NextAuth session is valid but the
  // backend cookie was somehow cleared (e.g. manual deletion, other tab logout).
  const hasBackendToken = !!req.cookies.get(TOKEN_COOKIE_NAME)?.value;

  const isLoggedIn = hasNextAuthSession;

  if (isAuthPage) {
    if (isLoggedIn) {
      // Already authenticated — send them to the main app
      return NextResponse.redirect(new URL(`${base}/`, req.url));
    }
    return NextResponse.next();
  }

  const isGuestAllowed = 
    pathname.startsWith("/chat/demo") || 
    pathname.startsWith(`${base}/chat/demo`);

  if (!isLoggedIn && !isGuestAllowed) {
    // Stash the current URL so we can redirect back after login
    const demoUrl = new URL(`${base}/chat/demo`, req.url);
    return NextResponse.redirect(demoUrl);
  }

  // If the user has a NextAuth session but the backend token is missing,
  // attach a warning header so server components can inform the user.
  if (!hasBackendToken) {
    const response = NextResponse.next();
    response.headers.set("X-Backend-Token-Missing", "1");
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.js$|.*\\.css$|.*\\.png$|.*\\.ico$|.*\\.svg$).*)",
  ],
};
