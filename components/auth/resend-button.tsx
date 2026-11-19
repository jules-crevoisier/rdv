"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOLDOWN = 60;

/**
 * Bouton « Renvoyer l'email » avec compte à rebours (le serveur refuse aussi
 * un nouvel envoi avant 60 s). `startCoolingDown` : un email vient de partir.
 */
export const ResendButton = ({
  email,
  type,
  endpoint = "/api/auth/email/resend-verification",
  label = "Renvoyer l'email",
  startCoolingDown = true,
  variant = "outline",
}: {
  email: string;
  type: "user" | "client";
  endpoint?: string;
  label?: string;
  startCoolingDown?: boolean;
  variant?: "outline" | "link";
}) => {
  const [remaining, setRemaining] = useState(startCoolingDown ? COOLDOWN : 0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const resend = async () => {
    setState("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
    setRemaining(COOLDOWN);
  };

  const disabled = remaining > 0 || state === "sending" || !email;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant={variant}
        onClick={resend}
        disabled={disabled}
        className={variant === "link" ? "h-auto justify-start p-0" : "w-full active:scale-[0.98]"}
      >
        {state === "sending" ? "Envoi..." : remaining > 0 ? `${label} (${remaining} s)` : label}
      </Button>
      <span aria-live="polite" className="text-xs text-muted-foreground">
        {state === "sent" ? "C'est reparti, regardez aussi dans les spams." : state === "error" ? "Échec de l'envoi, réessayez." : ""}
      </span>
    </div>
  );
};
