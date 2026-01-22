import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Vérifier si l'utilisateur a un cookie de session NextAuth
  // NextAuth v5 utilise "authjs.session-token" (ou variantes sécurisées)
  // Vérifier tous les noms de cookies possibles
  const hasSessionCookie = 
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");
  
  const isLoggedIn = hasSessionCookie;

  // Pages publiques
  const publicPaths = ["/login", "/register", "/book"];
  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page privée
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si l'utilisateur est connecté et essaie d'accéder à login/register
  if (isLoggedIn && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
