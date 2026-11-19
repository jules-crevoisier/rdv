import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type AccountType = "user" | "client";
export type TokenPurpose = "verify-email" | "reset-password";

const TTL_MS: Record<TokenPurpose, number> = {
  "verify-email": 24 * 60 * 60 * 1000,
  "reset-password": 60 * 60 * 1000,
};

/** Délai minimal entre deux emails du même type pour un même compte. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export const parseAccountType = (value: unknown): AccountType => (value === "client" ? "client" : "user");

/** Retourne false si un jeton du même type a été émis il y a moins d'une minute. */
export const canIssueToken = async (accountType: AccountType, accountId: string, purpose: TokenPurpose) => {
  const recent = await prisma.authToken.findFirst({
    where: { accountType, accountId, purpose, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  return !recent;
};

/** Crée un jeton à usage unique et invalide les précédents du même type. */
export const issueToken = async (accountType: AccountType, accountId: string, purpose: TokenPurpose) => {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { accountType, accountId, purpose, usedAt: null } }),
    prisma.authToken.create({
      data: {
        tokenHash: hash(token),
        purpose,
        accountType,
        accountId,
        expiresAt: new Date(Date.now() + TTL_MS[purpose]),
      },
    }),
  ]);
  // Ménage opportuniste des vieux jetons
  prisma.authToken
    .deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    .catch(() => {});
  return token;
};

export type TokenCheck =
  | { ok: true; accountType: AccountType; accountId: string; id: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Vérifie un jeton sans le consommer (pour afficher le formulaire de nouveau mot de passe). */
export const checkToken = async (token: string, purpose: TokenPurpose): Promise<TokenCheck> => {
  if (!token || token.length > 200) return { ok: false, reason: "invalid" };
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!row || row.purpose !== purpose) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  return { ok: true, accountType: parseAccountType(row.accountType), accountId: row.accountId, id: row.id };
};

/** Consomme un jeton de façon atomique : deux requêtes simultanées ne peuvent pas l'utiliser toutes les deux. */
export const consumeToken = async (token: string, purpose: TokenPurpose): Promise<TokenCheck> => {
  const check = await checkToken(token, purpose);
  if (!check.ok) return check;
  const { count } = await prisma.authToken.updateMany({
    where: { id: check.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1 ? check : { ok: false, reason: "used" };
};
