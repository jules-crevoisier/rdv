import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CLIENT_SESSION_COOKIE, PRO_SESSION_COOKIES } from "./lib/session-cookies";

// Pages ouvertes sans session
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/book",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/confidentialite",
  "/client/login",
  "/client/register",
];

// Espace client : session client requise
const CLIENT_PATHS = ["/client/appointments"];

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasProSession = PRO_SESSION_COOKIES.some((name) => request.cookies.has(name));
  const hasClientSession = request.cookies.has(CLIENT_SESSION_COOKIE);

  if (path === "/register") {
    return NextResponse.redirect(new URL(hasProSession ? "/" : "/login?tab=register", request.url));
  }

  if (startsWithAny(path, CLIENT_PATHS)) {
    if (!hasClientSession) {
      const url = new URL("/client/login", request.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (hasClientSession && (path === "/client/login" || path === "/client/register")) {
    return NextResponse.redirect(new URL("/client/appointments", request.url));
  }

  if (hasProSession && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!hasProSession && !startsWithAny(path, PUBLIC_PATHS)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Tout sauf les routes API, les fichiers statiques et le favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
