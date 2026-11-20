"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  value: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
};

/* Copie dans le presse-papiers avec un retour visuel sur place (pas d'alert). */
export const CopyButton = ({ value, label = "Copier le lien", variant = "outline", size = "default", className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const isIcon = size === "icon" || size === "icon-sm" || size === "icon-lg";

  return (
    <Button type="button" variant={variant} size={size} onClick={copy} className={className} aria-label={isIcon ? label : undefined}>
      {copied ? <Check className="text-success" /> : <Copy />}
      {!isIcon && <span aria-live="polite">{copied ? "Copié" : label}</span>}
    </Button>
  );
};
