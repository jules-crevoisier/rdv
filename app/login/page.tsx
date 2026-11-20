"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { FullScreenLoader } from "@/components/app/loading";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authNotice } from "@/lib/auth-notices";

const LoginContent = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const defaultTab = tab === "register" ? "register" : "login";

  return (
    <AuthShell title="Votre espace Reservy" description="Connectez-vous pour gérer vos créneaux et vos réservations.">
      <AuthForm
        defaultTab={defaultTab}
        defaultEmail={searchParams.get("email") ?? undefined}
        notice={authNotice(searchParams)}
      />
    </AuthShell>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginContent />
    </Suspense>
  );
}
