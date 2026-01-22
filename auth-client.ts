import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Import dynamique de Prisma pour éviter les problèmes d'initialisation
let prisma: any;
async function getPrisma() {
  if (!prisma) {
    try {
      const { prisma: prismaClient } = await import("./lib/prisma");
      prisma = prismaClient;
    } catch (error) {
      console.error("[AuthClient] Failed to import Prisma:", error);
      throw error;
    }
  }
  return prisma;
}

export const { handlers: clientHandlers, auth: clientAuth, signIn: clientSignIn, signOut: clientSignOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "ClientCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const db = await getPrisma();
          const client = await db.client.findUnique({
            where: { email: credentials.email as string },
          });

          if (!client) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            client.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: client.id,
            email: client.email,
            name: client.name || client.email,
            role: "client",
          };
        } catch (error) {
          console.error("Client auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/client/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = "client";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
