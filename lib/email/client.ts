import { Resend } from "resend";

export type EmailAttachment = {
  filename: string;
  content: string; // texte brut (ex. .ics)
  contentType?: string;
};

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  /** Évite les doublons si le même envoi est relancé (24 h côté Resend). */
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
};

let resend: Resend | null = null;

/** Les emails sont actifs dès que RESEND_API_KEY et EMAIL_FROM sont définis. */
export const isEmailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const getResend = () => {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

/**
 * Envoie un email via Resend. Ne lève jamais d'exception : un email raté
 * ne doit pas faire échouer une inscription ou une réservation.
 */
export const sendEmail = async (message: EmailMessage): Promise<{ ok: boolean; id?: string }> => {
  if (!isEmailEnabled()) {
    // Sans Resend configuré (dev local), on affiche l'email dans les logs pour pouvoir suivre les liens.
    console.info(
      `[email] Resend non configuré, email non envoyé.\n  À : ${[message.to].flat().join(", ")}\n  Objet : ${message.subject}\n${message.text
        .split("\n")
        .map((l) => `  | ${l}`)
        .join("\n")}`
    );
    return { ok: false };
  }

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo || process.env.EMAIL_REPLY_TO || undefined,
        tags: message.tags,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, "utf-8"),
          contentType: a.contentType,
        })),
      },
      message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined
    );
    if (error) {
      console.error("[email] Échec Resend :", error.name, error.message);
      return { ok: false };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    console.error("[email] Erreur d'envoi :", error);
    return { ok: false };
  }
};
