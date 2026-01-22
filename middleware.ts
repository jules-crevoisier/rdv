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
  
  // Routes client (nécessitent une session client)
  const clientPaths = ["/client/appointments"];
  const isClientPath = clientPaths.some((p) => path.startsWith(p));
  
  // Vérifier si c'est une session client
  const hasClientSessionCookie = 
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  // Si c'est une route client, vérifier la session client
  if (isClientPath && !hasClientSessionCookie) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page privée (non client)
  if (!isLoggedIn && !isPublicPath && !isClientPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si l'utilisateur est connecté et essaie d'accéder à login/register
  if (isLoggedIn && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Rediriger /register vers /login (même page maintenant)
  if (path === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Si le client est connecté et essaie d'accéder à client/login ou client/register
  if (hasClientSessionCookie && (path === "/client/login" || path === "/client/register")) {
    return NextResponse.redirect(new URL("/client/appointments", request.url));
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
