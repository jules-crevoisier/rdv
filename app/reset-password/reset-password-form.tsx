"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/auth/form-message";
import { PasswordInput } from "@/components/auth/password-input";

export const ResetPasswordForm = ({ token, type }: { token: string; type: "user" | "client" }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState<{ text: string; relink: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setFieldError("Au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field === "password") setFieldError(data.error);
        else setError({ text: data.error || "Une erreur est survenue.", relink: Boolean(data.reason) });
        setLoading(false);
        return;
      }
      const login = data.type === "client" ? "/client/login" : "/login";
      router.replace(`${login}?reset=1&email=${encodeURIComponent(data.email ?? "")}`);
    } catch {
      setError({ text: "Une erreur est survenue.", relink: false });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <FormMessage tone="error">
          <p>{error.text}</p>
          {error.relink ? (
            <Link href={`/forgot-password${type === "client" ? "?type=client" : ""}`} className="font-medium underline underline-offset-4">
              Demander un nouveau lien
            </Link>
          ) : null}
        </FormMessage>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="reset-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError("");
          }}
          placeholder="8 caractères minimum"
          required
          minLength={8}
          autoFocus
          disabled={loading}
          className="h-10"
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "reset-password-error" : undefined}
        />
        <FieldError id="reset-password-error" message={fieldError} />
      </div>
      <Button type="submit" className="h-10 w-full active:scale-[0.98]" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
};
