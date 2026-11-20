"use client";

import { MailCheck } from "lucide-react";
import { ResendButton } from "./resend-button";

/** Écran affiché après une inscription : l'adresse doit être confirmée. */
export const CheckInbox = ({
  email,
  type,
  onBack,
}: {
  email: string;
  type: "user" | "client";
  onBack?: () => void;
}) => (
  <div className="space-y-5 text-center">
    <div className="relative mx-auto flex size-16 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/10 [animation-duration:2.8s] motion-reduce:hidden" aria-hidden />
      <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <MailCheck className="size-7" aria-hidden />
      </span>
    </div>
    <div className="space-y-1.5">
      <h2 className="text-lg font-semibold tracking-tight">Vérifiez votre boîte mail</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Un lien de confirmation vient de partir à <span className="font-medium text-foreground">{email}</span>. Il est valable 24 heures.
      </p>
    </div>
    <ResendButton email={email} type={type} />
    {onBack ? (
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:underline"
      >
        Ce n&apos;est pas la bonne adresse ?
      </button>
    ) : null}
  </div>
);
