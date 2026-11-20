import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { consumeToken } from "@/lib/auth-tokens";
import { findAccountById, loginPath, markEmailVerified } from "@/lib/accounts";

export const metadata: Metadata = { title: "Confirmation de l'email - Reservy" };
export const dynamic = "force-dynamic";

const messages = {
  invalid: "Ce lien n'est pas valide. Vérifiez qu'il est complet, ou connectez-vous pour en recevoir un nouveau.",
  expired: "Ce lien a expiré (24 heures). Connectez-vous : vous pourrez en recevoir un nouveau en un clic.",
  used: "Ce lien a déjà servi. Votre adresse est sans doute déjà confirmée : essayez de vous connecter.",
};

const buttonClass =
  "inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string }>;
}) {
  const { token = "", type } = await searchParams;
  const result = await consumeToken(token, "verify-email");
  const fallbackType = type === "client" ? "client" : "user";

  if (!result.ok) {
    return (
      <AuthShell title="Lien inutilisable" description={messages[result.reason]}>
        <Link href={loginPath(fallbackType)} className={buttonClass}>
          Aller à la connexion
        </Link>
      </AuthShell>
    );
  }

  const account = await findAccountById(result.accountType, result.accountId);
  if (account && !account.emailVerified) await markEmailVerified(result.accountType, account.id);
  const href = `${loginPath(result.accountType)}?verified=1${account ? `&email=${encodeURIComponent(account.email)}` : ""}`;

  return (
    <AuthShell title="Adresse confirmée" description="Votre compte est actif. Vous pouvez vous connecter.">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
          <span className="min-w-0 truncate">{account?.email}</span>
        </div>
        <Link href={href} className={buttonClass}>
          Me connecter
        </Link>
      </div>
    </AuthShell>
  );
}
