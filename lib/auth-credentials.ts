import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import type { AccountType } from "@/lib/auth-tokens";

/** Erreur renvoyée au formulaire (`result.code`) quand l'adresse n'est pas encore confirmée. */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

/**
 * La confirmation d'adresse n'est exigée que si l'envoi d'emails est configuré,
 * sinon personne ne pourrait valider son compte. Désactivable via REQUIRE_EMAIL_VERIFICATION=false.
 */
export const isEmailVerificationRequired = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) &&
  process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

/** Vérifie email + mot de passe pour un type de compte. Import dynamique de Prisma (cf. auth.ts). */
export const authorizeAccount = async (type: AccountType, credentials: Partial<Record<string, unknown>>) => {
  const email = typeof credentials?.email === "string" ? credentials.email : "";
  const password = typeof credentials?.password === "string" ? credentials.password : "";
  if (!email || !password) return null;

  const { findAccountByEmail } = await import("@/lib/accounts");
  const account = await findAccountByEmail(type, email);

  // Comparaison même si le compte n'existe pas, pour ne pas révéler son existence par le temps de réponse.
  const valid = await bcrypt.compare(
    password,
    account?.password ?? "$2b$12$gEAD5.jlCpXmadD9wHbSfOs6/j5k1bVSw2p1T8hiHJcq1rjccCkL2"
  );
  if (!account || !valid) return null;

  if (!account.emailVerified && isEmailVerificationRequired()) {
    throw new EmailNotVerifiedError();
  }

  return { id: account.id, email: account.email, name: account.name || account.email };
};
