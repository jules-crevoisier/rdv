"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";
import { ResendButton } from "./resend-button";

type LoginFormProps = {
  type: "user" | "client";
  /** Où aller après connexion. */
  redirectTo: string;
  defaultEmail?: string;
  /** Message affiché au-dessus du formulaire (compte confirmé, mot de passe changé...). */
  notice?: string | null;
};

/** Formulaire de connexion commun aux pros et aux clients. */
export const LoginForm = ({ type, redirectTo, defaultEmail = "", notice }: LoginFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"credentials" | "unverified" | "unknown" | null>(null);
  const [loading, setLoading] = useState(false);
  const prefix = type === "client" ? "client-login" : "login";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(type === "client" ? "client-credentials" : "credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.code === "email_not_verified") setError("unverified");
      else if (result?.error) setError("credentials");
      else {
        router.push(redirectTo);
        router.refresh();
        return;
      }
    } catch {
      setError("unknown");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      {notice && !error ? <FormMessage tone="success">{notice}</FormMessage> : null}
      {error === "credentials" ? <FormMessage tone="error">Email ou mot de passe incorrect.</FormMessage> : null}
      {error === "unknown" ? <FormMessage tone="error">Connexion impossible pour le moment, réessayez.</FormMessage> : null}
      {error === "unverified" ? (
        <FormMessage tone="error">
          <p>Confirmez d&apos;abord votre adresse avec le lien reçu par email.</p>
          <ResendButton email={email} type={type} startCoolingDown={false} variant="link" label="Renvoyer le lien" />
        </FormMessage>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          required
          disabled={loading}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${prefix}-password`}>Mot de passe</Label>
          <Link
            href={`/forgot-password${type === "client" ? "?type=client" : ""}${email ? `${type === "client" ? "&" : "?"}email=${encodeURIComponent(email)}` : ""}`}
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput
          id={`${prefix}-password`}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          className="h-10"
        />
      </div>

      <Button type="submit" className="h-10 w-full active:scale-[0.98]" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
};
