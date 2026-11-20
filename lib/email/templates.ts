import { APP_NAME, APP_TIMEZONE } from "@/lib/app-config";
import { renderEmail, type DateTile, type EmailContent, type TicketRow } from "./layout";

// ---------- Comptes ----------

export const verifyEmailTemplate = (p: { name?: string | null; url: string }) => ({
  subject: `Confirmez votre adresse email`,
  ...renderEmail({
    preheader: `Un clic pour activer votre compte ${APP_NAME}.`,
    heading: p.name ? `Bienvenue ${p.name}` : "Bienvenue",
    paragraphs: [
      `Votre compte ${APP_NAME} est presque prêt. Confirmez votre adresse email pour pouvoir vous connecter.`,
    ],
    cta: { label: "Confirmer mon adresse", url: p.url },
    footnote: `Ce lien est valable 24 heures. S'il ne s'ouvre pas, copiez cette adresse dans votre navigateur : ${p.url}`,
  }),
});

export const resetPasswordTemplate = (p: { name?: string | null; url: string }) => ({
  subject: `Réinitialisez votre mot de passe`,
  ...renderEmail({
    preheader: "Choisissez un nouveau mot de passe, le lien expire dans 1 heure.",
    heading: "Nouveau mot de passe",
    paragraphs: [
      `${p.name ? `Bonjour ${p.name}, vous` : "Vous"} avez demandé à changer le mot de passe de votre compte ${APP_NAME}.`,
      "Le lien ci-dessous est valable 1 heure et ne sert qu'une fois.",
    ],
    cta: { label: "Choisir un mot de passe", url: p.url },
    footnote: `Vous n'avez rien demandé ? Ignorez cet email, votre mot de passe actuel reste valable. Lien : ${p.url}`,
  }),
});

export const passwordChangedTemplate = (p: { name?: string | null; loginUrl: string; forgotUrl: string }) => ({
  subject: `Votre mot de passe a été modifié`,
  ...renderEmail({
    preheader: "Le mot de passe de votre compte vient d'être changé.",
    heading: "Mot de passe modifié",
    paragraphs: [
      `${p.name ? `Bonjour ${p.name}, le` : "Le"} mot de passe de votre compte ${APP_NAME} vient d'être changé.`,
      "Si c'est bien vous, il n'y a rien à faire. Sinon, réinitialisez-le tout de suite.",
    ],
    cta: { label: "Me connecter", url: p.loginUrl },
    footnote: `Ce n'était pas vous ? Réinitialisez votre mot de passe : ${p.forgotUrl}`,
  }),
});

// ---------- Rendez-vous ----------

export type AppointmentForEmail = {
  id: string;
  startTime: Date;
  endTime: Date;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  notes?: string | null;
  location?: string | null;
  meetingType: string;
  videoLink?: string | null;
  status: string;
  eventType: { name: string; duration: number };
  user: { name?: string | null; email: string };
};

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: APP_TIMEZONE, ...options }).format(date);

export const formatWhen = (date: Date) =>
  fmt(date, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const tileFor = (date: Date): DateTile => ({
  month: fmt(date, { month: "short" }).replace(".", ""),
  day: fmt(date, { day: "numeric" }),
  weekday: fmt(date, { weekday: "long" }),
  time: fmt(date, { hour: "2-digit", minute: "2-digit" }),
});

const hostName = (a: AppointmentForEmail) => a.user.name || a.user.email;

const ticketRows = (a: AppointmentForEmail, audience: "client" | "pro"): TicketRow[] => {
  const rows: TicketRow[] = [];
  const start = fmt(a.startTime, { hour: "2-digit", minute: "2-digit" });
  const end = fmt(a.endTime, { hour: "2-digit", minute: "2-digit" });
  rows.push({ label: "Horaire", value: `${start} à ${end} (${a.eventType.duration} min)` });
  if (audience === "client") rows.push({ label: "Avec", value: hostName(a) });
  else {
    rows.push({ label: "Client", value: a.clientName });
    rows.push({ label: "Email", value: a.clientEmail, href: `mailto:${a.clientEmail}` });
    if (a.clientPhone) rows.push({ label: "Téléphone", value: a.clientPhone, href: `tel:${a.clientPhone}` });
  }
  if (a.meetingType === "video") {
    rows.push(a.videoLink ? { label: "Visio", value: "Rejoindre la visio", href: a.videoLink } : { label: "Format", value: "Visio" });
  } else if (a.location) {
    rows.push({ label: "Lieu", value: a.location });
  }
  if (a.notes && audience === "pro") rows.push({ label: "Note", value: a.notes });
  return rows;
};

const stampFor = (status: string): NonNullable<EmailContent["ticket"]>["stamp"] => {
  if (status === "confirmed") return { label: "Confirmé", tone: "ok" };
  if (status === "cancelled") return { label: "Annulé", tone: "off" };
  return { label: "En attente de validation", tone: "wait" };
};

const ticket = (a: AppointmentForEmail, audience: "client" | "pro") => ({
  tile: tileFor(a.startTime),
  title: a.eventType.name,
  rows: ticketRows(a, audience),
  stamp: stampFor(a.status),
});

/** Au client, juste après sa réservation (confirmée d'office ou en attente). */
export const bookingReceivedTemplate = (a: AppointmentForEmail, p: { manageUrl: string }) => {
  const pending = a.status === "pending";
  return {
    subject: pending
      ? `Demande envoyée : ${a.eventType.name}, ${formatWhen(a.startTime)}`
      : `Rendez-vous confirmé : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
    ...renderEmail({
      preheader: pending
        ? `${hostName(a)} doit encore valider votre créneau.`
        : `C'est noté pour ${formatWhen(a.startTime)}.`,
      heading: pending ? "Demande bien reçue" : "C'est réservé",
      paragraphs: [
        `Bonjour ${a.clientName},`,
        pending
          ? `${hostName(a)} doit valider ce créneau. Vous recevrez un email dès que c'est fait.`
          : `Votre rendez-vous avec ${hostName(a)} est confirmé. L'invitation est jointe pour l'ajouter à votre agenda.`,
      ],
      ticket: ticket(a, "client"),
      cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
    }),
  };
};

/** Au pro, à chaque nouvelle réservation. */
export const newBookingForProTemplate = (a: AppointmentForEmail, p: { dashboardUrl: string }) => {
  const pending = a.status === "pending";
  return {
    subject: pending
      ? `À valider : ${a.clientName}, ${formatWhen(a.startTime)}`
      : `Nouveau rendez-vous : ${a.clientName}, ${formatWhen(a.startTime)}`,
    ...renderEmail({
      preheader: `${a.clientName} a réservé « ${a.eventType.name} ».`,
      heading: pending ? "Une demande attend votre accord" : "Nouveau rendez-vous",
      paragraphs: [
        pending
          ? `${a.clientName} demande un créneau. Il reste en attente tant que vous ne l'avez pas confirmé.`
          : `${a.clientName} vient de réserver un créneau dans votre agenda.`,
      ],
      ticket: ticket(a, "pro"),
      cta: { label: pending ? "Valider la demande" : "Ouvrir mes rendez-vous", url: p.dashboardUrl },
    }),
  };
};

/** Au client, quand le pro confirme une demande. */
export const bookingConfirmedTemplate = (a: AppointmentForEmail, p: { manageUrl: string }) => ({
  subject: `Confirmé : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `${hostName(a)} a validé votre demande.`,
    heading: "Votre rendez-vous est confirmé",
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `${hostName(a)} a validé votre demande. L'invitation est jointe pour l'ajouter à votre agenda.`,
    ],
    ticket: ticket(a, "client"),
    cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
  }),
});

/** Au client (ou au pro), quand un rendez-vous est annulé. */
export const bookingCancelledTemplate = (
  a: AppointmentForEmail,
  p: { audience: "client" | "pro"; rebookUrl: string; byClient?: boolean }
) => ({
  subject: `Annulé : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: "Ce créneau est libéré.",
    heading: "Rendez-vous annulé",
    paragraphs:
      p.audience === "client"
        ? [
            `Bonjour ${a.clientName},`,
            `Votre rendez-vous avec ${hostName(a)} du ${formatWhen(a.startTime)} est annulé.`,
            "Vous pouvez choisir un autre créneau quand vous voulez.",
          ]
        : [`${a.clientName} a annulé son rendez-vous du ${formatWhen(a.startTime)}. Le créneau est de nouveau libre.`],
    ticket: { ...ticket(a, p.audience), stamp: { label: "Annulé", tone: "off" } },
    cta: { label: p.audience === "client" ? "Choisir un autre créneau" : "Ouvrir mes rendez-vous", url: p.rebookUrl },
  }),
});

/** Au client, quand l'horaire change. */
export const bookingRescheduledTemplate = (a: AppointmentForEmail, p: { previousStart: Date; manageUrl: string }) => ({
  subject: `Nouvel horaire : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `Votre rendez-vous passe au ${formatWhen(a.startTime)}.`,
    heading: "Votre rendez-vous a changé d'horaire",
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `${hostName(a)} a déplacé votre rendez-vous du ${formatWhen(p.previousStart)} au ${formatWhen(a.startTime)}. L'invitation jointe met votre agenda à jour.`,
    ],
    ticket: ticket(a, "client"),
    cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
  }),
});

const dayWord = (date: Date) => {
  const day = (d: Date) => fmt(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  if (day(date) === day(new Date())) return "aujourd'hui";
  if (day(date) === day(new Date(Date.now() + 24 * 60 * 60 * 1000))) return "demain";
  return `le ${fmt(date, { weekday: "long", day: "numeric", month: "long" })}`;
};

/** Au client, environ 24 h avant. */
export const bookingReminderTemplate = (a: AppointmentForEmail, p: { manageUrl: string }) => ({
  subject: `Rappel : ${a.eventType.name} ${dayWord(a.startTime)} à ${fmt(a.startTime, { hour: "2-digit", minute: "2-digit" })}`,
  ...renderEmail({
    preheader: `Rendez-vous avec ${hostName(a)}, ${formatWhen(a.startTime)}.`,
    heading: dayWord(a.startTime) === "demain" ? "À demain" : "Rappel de rendez-vous",
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `Petit rappel de votre rendez-vous avec ${hostName(a)}. En cas d'empêchement, prévenez-le en répondant à cet email.`,
    ],
    ticket: ticket(a, "client"),
    cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
  }),
});
