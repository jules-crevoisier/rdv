"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authNotice } from "@/lib/auth-notices";

const ClientLoginContent = () => {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  // On n'accepte qu'un chemin interne pour éviter les redirections ouvertes
  const redirectTo = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/client/appointments";

  return (
    <AuthShell
      title="Connexion client"
      description="Retrouvez vos rendez-vous passés et à venir."
    >
      <LoginForm
        type="client"
        redirectTo={redirectTo}
        defaultEmail={params.get("email") ?? undefined}
        notice={authNotice(params) ?? (params.get("registered") ? "Compte créé. Vous pouvez vous connecter." : null)}
      />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
          <Link href="/client/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Créer un compte
          </Link>
      </p>
    </AuthShell>
  );
};

export default function ClientLoginPage() {
  return (
    <Suspense>
      <ClientLoginContent />
    </Suspense>
  );
}
