"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LoginContent = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const defaultTab = tab === "register" ? "register" : "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <AuthForm defaultTab={defaultTab} />
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
