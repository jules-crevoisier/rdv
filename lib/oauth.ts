import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import type { Account, Profile } from "next-auth";
import type { AccountType } from "@/lib/auth-tokens";

// Connexion Google et Discord, partagée par les deux instances NextAuth (pros dans auth.ts, clients dans auth-client.ts).
// Un fournisseur n'apparaît que si ses deux variables sont définies, donc rien ne casse tant qu'elles manquent.
// URLs de redirection à déclarer chez Google et Discord :
//   pros    : {APP_URL}/api/auth/callback/google      et {APP_URL}/api/auth/callback/discord
//   clients : {APP_URL}/api/auth/client/callback/google et {APP_URL}/api/auth/client/callback/discord

export const OAUTH_PROVIDER_IDS = ["google", "discord"] as const;

export const oauthProviders = () => {
  const providers = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    );
  }
  if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
    providers.push(
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
        // Discord renvoie désormais « iss » au retour (RFC 9207). Sans issuer déclaré, Auth.js attend
        // « https://authjs.dev » et refuse la connexion (CallbackRouteError, error=Configuration).
        issuer: "https://discord.com",
      })
    );
  }
  return providers;
};

export const isOAuthAccount = (account: Account | null | undefined): account is Account =>
  !!account && (OAUTH_PROVIDER_IDS as readonly string[]).includes(account.provider);

/**
 * Le compte est retrouvé par son email : on n'accepte donc qu'une adresse que le fournisseur a vérifiée,
 * sinon n'importe qui pourrait se connecter au compte d'un autre en déclarant son adresse.
 */
export const hasVerifiedEmail = (provider: string, profile: Profile | undefined) => {
  if (!profile || typeof profile.email !== "string" || !profile.email) return false;
  if (provider === "google") return profile.email_verified === true;
  if (provider === "discord") return (profile as Record<string, unknown>).verified === true;
  return false;
};

/** Retrouve le compte (pro ou client) de cet email, ou le crée. Import dynamique de Prisma (cf. auth.ts). */
export const findOrCreateOAuthAccount = async (type: AccountType, email: string, name?: string | null) => {
  const { prisma } = await import("@/lib/prisma");
  const { findAccountByEmail, markEmailVerified, normalizeEmail } = await import("@/lib/accounts");

  const existing = await findAccountByEmail(type, email);
  if (existing) {
    // Le fournisseur a vérifié l'adresse : inutile d'attendre le lien de confirmation.
    if (!existing.emailVerified) await markEmailVerified(type, existing.id);
    return { id: existing.id, email: existing.email, name: existing.name };
  }

  const data = { email: normalizeEmail(email), name: name?.trim() || null, password: null, emailVerified: new Date() };
  const select = { id: true, email: true, name: true } as const;
  return type === "client" ? prisma.client.create({ data, select }) : prisma.user.create({ data, select });
};
