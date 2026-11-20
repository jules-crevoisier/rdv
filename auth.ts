import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorizeAccount, EmailNotVerifiedError } from "./lib/auth-credentials";
import { findOrCreateOAuthAccount, hasVerifiedEmail, isOAuthAccount, oauthProviders } from "./lib/oauth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true, // Nécessaire pour NextAuth v5 en développement et production
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          return await authorizeAccount("user", credentials);
        } catch (error) {
          if (error instanceof EmailNotVerifiedError) throw error;
          console.error("[Auth] user authorize error:", error);
          return null;
        }
      },
    }),
    ...oauthProviders(),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Google / Discord : refusé si l'email n'est pas vérifié chez le fournisseur (renvoie ?error=AccessDenied).
    async signIn({ account, profile }) {
      if (!isOAuthAccount(account)) return true;
      return hasVerifiedEmail(account.provider, profile);
    },
    async jwt({ token, user, account }) {
      if (isOAuthAccount(account) && user?.email) {
        // L'id reçu est celui du fournisseur : on le remplace par celui du compte pro en base.
        const dbAccount = await findOrCreateOAuthAccount("user", user.email, user.name);
        token.id = dbAccount.id;
        token.email = dbAccount.email;
        token.name = dbAccount.name || dbAccount.email;
      } else if (user) {
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
