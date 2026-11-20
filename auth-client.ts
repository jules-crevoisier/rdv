import NextAuth from "next-auth";
import { CLIENT_SESSION_COOKIE } from "./lib/session-cookies";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorizeAccount, EmailNotVerifiedError } from "./lib/auth-credentials";

export const { handlers: clientHandlers, auth: clientAuth, signIn: clientSignIn, signOut: clientSignOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true, // Nécessaire pour NextAuth v5 en développement et production
  basePath: "/api/auth/client", // Spécifier le basePath pour cette instance NextAuth
  debug: process.env.NODE_ENV === "development", // Activer le debug en développement
  // Configuration pour éviter les erreurs 405
  pages: {
    signIn: "/client/login",
    error: "/client/login",
  },
  providers: [
    CredentialsProvider({
      id: "client-credentials",
      name: "ClientCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          return await authorizeAccount("client", credentials);
        } catch (error) {
          if (error instanceof EmailNotVerifiedError) throw error;
          console.error("[Auth] client authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  // Cookies distincts de ceux des pros (auth.ts) : sans ça, une session client
  // était lue comme une session pro et inversement.
  cookies: {
    sessionToken: { name: CLIENT_SESSION_COOKIE },
    callbackUrl: { name: "rdv-client.callback-url" },
    csrfToken: { name: "rdv-client.csrf-token" },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
