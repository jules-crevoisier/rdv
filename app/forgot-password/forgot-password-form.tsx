"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/form-message";
import { ResendButton } from "@/components/auth/resend-button";

export const ForgotPasswordForm = ({ type, defaultEmail = "" }: { type: "user" | "client"; defaultEmail?: string }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Une erreur est survenue.");
      } else setSent(true);
    } catch {
      setError("Une erreur est survenue.");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm leading-relaxed" role="status">
            Si un compte existe pour <span className="font-medium">{email}</span>, un lien vient de partir. Il est valable 1 heure.
          </p>
        </div>
        <ResendButton email={email} type={type} endpoint="/api/auth/password/forgot" label="Renvoyer le lien" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          required
          autoFocus
          disabled={loading}
          className="h-10"
          aria-invalid={!!error}
          aria-describedby={error ? "forgot-email-error" : undefined}
        />
        <FieldError id="forgot-email-error" message={error} />
      </div>
      <Button type="submit" className="h-10 w-full active:scale-[0.98]" disabled={loading}>
        {loading ? "Envoi..." : "Recevoir le lien"}
      </Button>
    </form>
  );
};
