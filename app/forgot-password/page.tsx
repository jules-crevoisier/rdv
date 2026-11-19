import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié - Reservy" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; email?: string }>;
}) {
  const { type, email } = await searchParams;
  const accountType = type === "client" ? "client" : "user";
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indiquez votre email, on vous envoie un lien pour en choisir un nouveau."
      footer={
        <Link
          href={accountType === "client" ? "/client/login" : "/login"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      }
    >
      <ForgotPasswordForm type={accountType} defaultEmail={email} />
    </AuthShell>
  );
}
