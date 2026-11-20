import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { checkToken } from "@/lib/auth-tokens";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe - Reservy" };
export const dynamic = "force-dynamic";

const messages = {
  invalid: "Ce lien n'est pas valide. Vérifiez qu'il est complet ou demandez-en un nouveau.",
  expired: "Ce lien a expiré : il n'est valable qu'une heure. Demandez-en un nouveau.",
  used: "Ce lien a déjà servi. Demandez-en un nouveau si besoin.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string }>;
}) {
  const { token = "", type } = await searchParams;
  // On vérifie le lien sans le consommer : il ne sert qu'à l'envoi du formulaire.
  const check = await checkToken(token, "reset-password");
  const accountType = check.ok ? check.accountType : type === "client" ? "client" : "user";
  const forgotHref = `/forgot-password${accountType === "client" ? "?type=client" : ""}`;

  if (!check.ok) {
    return (
      <AuthShell
        title="Lien inutilisable"
        description={messages[check.reason]}
      >
        <Link
          href={forgotHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Demander un nouveau lien
        </Link>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href={accountType === "client" ? "/client/login" : "/login"} className="font-medium text-foreground underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choisissez un nouveau mot de passe" description="Il remplacera l'ancien sur votre compte.">
      <ResetPasswordForm token={token} type={accountType} />
    </AuthShell>
  );
}
