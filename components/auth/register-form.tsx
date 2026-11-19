"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckInbox } from "./check-inbox";
import { FieldError, FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";

type Field = "name" | "email" | "phone" | "password";

/** Inscription commune : pro (nom optionnel) ou client (avec téléphone). */
export const RegisterForm = ({ type, redirectTo }: { type: "user" | "client"; redirectTo: string }) => {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const prefix = type === "client" ? "client-register" : "register";

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setFieldErrors({ password: "Au moins 8 caractères." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(type === "client" ? "/api/auth/client/register" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name || undefined,
          phone: type === "client" ? form.phone || undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field && ["name", "email", "phone", "password"].includes(data.field)) {
          setFieldErrors({ [data.field as Field]: data.error });
        } else setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      if (data.verificationRequired) {
        setSentTo(form.email);
        setLoading(false);
        return;
      }
      // Pas de confirmation exigée : on connecte directement.
      const result = await signIn(type === "client" ? "client-credentials" : "credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Compte créé. Connectez-vous avec vos identifiants.");
        setLoading(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  };

  if (sentTo) {
    return <CheckInbox email={sentTo} type={type} onBack={() => setSentTo(null)} />;
  }

  const describedBy = (f: Field) => (fieldErrors[f] ? `${prefix}-${f}-error` : undefined);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>{type === "client" ? "Nom complet" : "Nom"}</Label>
        <Input
          id={`${prefix}-name`}
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          placeholder="Camille Martin"
          disabled={loading}
          className="h-10"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={describedBy("name")}
        />
        <FieldError id={`${prefix}-name-error`} message={fieldErrors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={set("email")}
          placeholder="vous@exemple.fr"
          required
          disabled={loading}
          className="h-10"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={describedBy("email")}
        />
        <FieldError id={`${prefix}-email-error`} message={fieldErrors.email} />
      </div>

      {type === "client" ? (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-phone`}>
            Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span>
          </Label>
          <Input
            id={`${prefix}-phone`}
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            disabled={loading}
            className="h-10"
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={describedBy("phone")}
          />
          <FieldError id={`${prefix}-phone-error`} message={fieldErrors.phone} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-password`}>Mot de passe</Label>
        <PasswordInput
          id={`${prefix}-password`}
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          placeholder="8 caractères minimum"
          required
          minLength={8}
          disabled={loading}
          className="h-10"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={describedBy("password") ?? `${prefix}-password-hint`}
        />
        {fieldErrors.password ? (
          <FieldError id={`${prefix}-password-error`} message={fieldErrors.password} />
        ) : (
          <p id={`${prefix}-password-hint`} className="text-xs text-muted-foreground">
            8 caractères minimum. Le bouton œil permet de vérifier la saisie.
          </p>
        )}
      </div>

      <Button type="submit" className="h-10 w-full active:scale-[0.98]" disabled={loading}>
        {loading ? "Création du compte..." : "Créer mon compte"}
      </Button>
    </form>
  );
};
