import { APP_NAME, APP_TIMEZONE } from "@/lib/app-config";
import { renderEmail, type DetailRow } from "./layout";

// ---------- Comptes ----------

const hello = (name?: string | null) => (name ? `Bonjour ${name},` : "Bonjour,");

export const verifyEmailTemplate = (p: { name?: string | null; url: string }) => ({
  subject: `Confirmez votre adresse email`,
  ...renderEmail({
    preheader: `Confirmez votre adresse pour activer votre compte ${APP_NAME}.`,
    heading: "Confirmez votre adresse email",
    paragraphs: [hello(p.name), `Cliquez sur le bouton ci-dessous pour activer votre compte ${APP_NAME}.`],
    cta: { label: "Confirmer mon adresse", url: p.url },
    footnote: `Le lien est valable 24 heures. S'il ne s'ouvre pas, copiez cette adresse dans votre navigateur : ${p.url}`,
  }),
});

export const resetPasswordTemplate = (p: { name?: string | null; url: string }) => ({
  subject: `Réinitialisez votre mot de passe`,
  ...renderEmail({
    preheader: "Le lien est valable 1 heure.",
    heading: "Réinitialiser votre mot de passe",
    paragraphs: [
      hello(p.name),
      `Vous avez demandé à changer le mot de passe de votre compte ${APP_NAME}. Le lien ci-dessous est valable 1 heure et ne sert qu'une fois.`,
    ],
    cta: { label: "Choisir un mot de passe", url: p.url },
    footnote: `Si vous n'avez rien demandé, ignorez cet email : votre mot de passe actuel reste valable. Lien : ${p.url}`,
  }),
});

export const passwordChangedTemplate = (p: { name?: string | null; loginUrl: string; forgotUrl: string }) => ({
  subject: `Votre mot de passe a été modifié`,
  ...renderEmail({
    preheader: "Le mot de passe de votre compte vient d'être changé.",
    heading: "Mot de passe modifié",
    paragraphs: [
      hello(p.name),
      `Le mot de passe de votre compte ${APP_NAME} vient d'être changé. Si c'est bien vous, il n'y a rien à faire.`,
    ],
    cta: { label: "Me connecter", url: p.loginUrl },
    footnote: `Ce n'était pas vous ? Réinitialisez votre mot de passe tout de suite : ${p.forgotUrl}`,
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
  /** Responsables présents (entretiens). */
  staff?: { name: string; email: string }[];
};

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: APP_TIMEZONE, ...options }).format(date);

export const formatWhen = (date: Date) =>
  fmt(date, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const hostName = (a: AppointmentForEmail) => a.user.name || a.user.email;

const time = (date: Date) => fmt(date, { hour: "2-digit", minute: "2-digit" });

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/** « Mercredi 25 novembre, 13:30 à 13:45 » */
const whenLine = (a: AppointmentForEmail) =>
  `${capitalize(fmt(a.startTime, { weekday: "long", day: "numeric", month: "long" }))}, ${time(a.startTime)} à ${time(a.endTime)}`;

const detailRows = (a: AppointmentForEmail, audience: "client" | "pro"): DetailRow[] => {
  const rows: DetailRow[] = [{ label: "Date", value: whenLine(a) }];
  if (audience === "client") rows.push({ label: "Avec", value: hostName(a) });
  else {
    rows.push({ label: "Avec", value: a.clientName });
    rows.push({ label: "Email", value: a.clientEmail, href: `mailto:${a.clientEmail}` });
    if (a.clientPhone) rows.push({ label: "Téléphone", value: a.clientPhone, href: `tel:${a.clientPhone}` });
  }
  if (a.meetingType === "video") {
    rows.push(a.videoLink ? { label: "Visio", value: a.videoLink, href: a.videoLink } : { label: "Lieu", value: "En visio" });
  } else if (a.location) {
    rows.push({ label: "Lieu", value: a.location });
  }
  if (a.notes && audience === "pro") rows.push({ label: "Note", value: a.notes });
  if (audience === "pro" && a.staff?.length) rows.push({ label: "Responsables", value: a.staff.map((s) => s.name).join(", ") });
  return rows;
};

const details = (a: AppointmentForEmail, audience: "client" | "pro") => ({
  title: `${a.eventType.name} (${a.eventType.duration} min)`,
  rows: detailRows(a, audience),
})


/** Au client, juste après sa réservation (confirmée d'office ou en attente). */
export const bookingReceivedTemplate = (a: AppointmentForEmail, p: { manageUrl: string }) => {
  const pending = a.status === "pending";
  return {
    subject: pending
      ? `Demande envoyée : ${a.eventType.name}, ${formatWhen(a.startTime)}`
      : `Rendez-vous confirmé : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
    ...renderEmail({
      preheader: pending ? `${hostName(a)} doit encore valider ce créneau.` : `Rendez-vous le ${formatWhen(a.startTime)}.`,
      heading: pending ? "Demande envoyée" : "Rendez-vous confirmé",
      paragraphs: [
        `Bonjour ${a.clientName},`,
        pending
          ? `${hostName(a)} doit valider ce créneau. Vous recevrez un email dès que ce sera fait.`
          : `Votre rendez-vous avec ${hostName(a)} est confirmé. L'invitation pour votre agenda est en pièce jointe.`,
      ],
      details: details(a, "client"),
      cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
      footnote: "Pour annuler ou signaler un empêchement, répondez simplement à cet email.",
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
      heading: pending ? "Demande à valider" : "Nouveau rendez-vous",
      paragraphs: [
        pending
          ? `${a.clientName} demande un créneau. Il reste en attente tant que vous ne l'avez pas confirmé.`
          : `${a.clientName} a réservé un créneau.`,
      ],
      details: details(a, "pro"),
      cta: { label: pending ? "Valider la demande" : "Voir les rendez-vous", url: p.dashboardUrl },
    }),
  };
};

/** Au client, quand le pro confirme une demande. */
export const bookingConfirmedTemplate = (a: AppointmentForEmail, p: { manageUrl: string }) => ({
  subject: `Confirmé : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `${hostName(a)} a validé votre demande.`,
    heading: "Rendez-vous confirmé",
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `${hostName(a)} a validé votre demande. L'invitation pour votre agenda est en pièce jointe.`,
    ],
    details: details(a, "client"),
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
    preheader: "Ce rendez-vous est annulé.",
    heading: "Rendez-vous annulé",
    paragraphs:
      p.audience === "client"
        ? [
            `Bonjour ${a.clientName},`,
            `Votre rendez-vous avec ${hostName(a)} du ${formatWhen(a.startTime)} est annulé. Vous pouvez choisir un autre créneau quand vous voulez.`,
          ]
        : [`${a.clientName} a annulé son rendez-vous du ${formatWhen(a.startTime)}. Le créneau est de nouveau libre.`],
    details: details(a, p.audience),
    cta: { label: p.audience === "client" ? "Choisir un autre créneau" : "Voir les rendez-vous", url: p.rebookUrl },
  }),
});

/** Au client, quand l'horaire change. */
export const bookingRescheduledTemplate = (a: AppointmentForEmail, p: { previousStart: Date; manageUrl: string }) => ({
  subject: `Nouvel horaire : ${a.eventType.name}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `Votre rendez-vous passe au ${formatWhen(a.startTime)}.`,
    heading: "Nouvel horaire",
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `${hostName(a)} a déplacé votre rendez-vous du ${formatWhen(p.previousStart)} au ${formatWhen(a.startTime)}. L'invitation jointe met votre agenda à jour.`,
    ],
    details: details(a, "client"),
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
  subject: `Rappel : ${a.eventType.name} ${dayWord(a.startTime)} à ${time(a.startTime)}`,
  ...renderEmail({
    preheader: `Rendez-vous avec ${hostName(a)}, ${formatWhen(a.startTime)}.`,
    heading: `Rendez-vous ${dayWord(a.startTime)} à ${time(a.startTime)}`,
    paragraphs: [
      `Bonjour ${a.clientName},`,
      `Un petit rappel pour votre rendez-vous avec ${hostName(a)}. En cas d'empêchement, répondez à cet email pour prévenir.`,
    ],
    details: details(a, "client"),
    cta: { label: "Voir mon rendez-vous", url: p.manageUrl },
  }),
});

// ---------- Responsables d'entretien ----------

/** À un responsable ajouté sur un rendez-vous (à la réservation ou par l'organisateur). */
export const staffInvitedTemplate = (a: AppointmentForEmail, p: { staffName: string; url: string }) => ({
  subject: `Entretien : ${a.clientName}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `${a.eventType.name} avec ${a.clientName}, ${formatWhen(a.startTime)}.`,
    heading: `Entretien avec ${a.clientName}`,
    paragraphs: [
      `Bonjour ${p.staffName},`,
      `${hostName(a)} vous a confié cet entretien. L'invitation pour votre agenda est en pièce jointe.`,
    ],
    details: details(a, "pro"),
    cta: { label: "Voir mes entretiens", url: p.url },
    footnote: `Un empêchement ? Répondez à cet email pour prévenir ${hostName(a)}.`,
  }),
});

/** À un responsable qu'on vient d'ajouter à l'annuaire : lien pour créer son compte (ou se connecter). */
export const staffWelcomeTemplate = (p: { staffName: string; hostName: string; url: string; hasAccount: boolean }) => ({
  subject: `${p.hostName} vous ajoute aux entretiens sur ${APP_NAME}`,
  ...renderEmail({
    preheader: "Retrouvez les entretiens qui vous sont confiés sur votre compte.",
    heading: "Vous êtes responsable d'entretiens",
    paragraphs: [
      `Bonjour ${p.staffName},`,
      `Vous faites désormais partie des responsables d'entretien de ${p.hostName} sur ${APP_NAME}. Vous recevrez un email avec une invitation pour chaque entretien qui vous est confié.`,
      p.hasAccount
        ? "Connectez-vous avec cette adresse pour voir tous vos entretiens au même endroit."
        : "Créez votre compte avec cette adresse (ou continuez avec Google ou Discord) pour voir tous vos entretiens au même endroit.",
    ],
    cta: { label: p.hasAccount ? "Voir mes entretiens" : "Créer mon compte", url: p.url },
    footnote: "Utilisez bien cette adresse email : c'est elle qui relie les entretiens à votre compte.",
  }),
});

/** À un responsable qui n'est plus attendu : rendez-vous annulé ou responsable retiré. */
export const staffCancelledTemplate = (
  a: AppointmentForEmail,
  p: { staffName: string; reason: "cancelled" | "removed"; url: string }
) => ({
  subject: `${p.reason === "cancelled" ? "Annulé" : "Retiré"} : entretien avec ${a.clientName}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: p.reason === "cancelled" ? "Cet entretien est annulé." : "Vous n'êtes plus responsable de cet entretien.",
    heading: p.reason === "cancelled" ? "Entretien annulé" : "Vous n'êtes plus sur cet entretien",
    paragraphs: [
      `Bonjour ${p.staffName},`,
      p.reason === "cancelled"
        ? `L'entretien avec ${a.clientName} du ${formatWhen(a.startTime)} est annulé. L'invitation jointe le retire de votre agenda.`
        : `${hostName(a)} a retiré votre nom de l'entretien avec ${a.clientName} du ${formatWhen(a.startTime)}. L'invitation jointe le retire de votre agenda.`,
    ],
    details: details(a, "pro"),
    cta: { label: "Voir mes entretiens", url: p.url },
  }),
});

/** À un responsable, quand l'horaire de l'entretien change. */
export const staffRescheduledTemplate = (
  a: AppointmentForEmail,
  p: { staffName: string; previousStart: Date; url: string }
) => ({
  subject: `Nouvel horaire : entretien avec ${a.clientName}, ${formatWhen(a.startTime)}`,
  ...renderEmail({
    preheader: `L'entretien passe au ${formatWhen(a.startTime)}.`,
    heading: "L'entretien change d'horaire",
    paragraphs: [
      `Bonjour ${p.staffName},`,
      `L'entretien avec ${a.clientName} passe du ${formatWhen(p.previousStart)} au ${formatWhen(a.startTime)}. L'invitation jointe met votre agenda à jour.`,
    ],
    details: details(a, "pro"),
    cta: { label: "Voir mes entretiens", url: p.url },
  }),
});
