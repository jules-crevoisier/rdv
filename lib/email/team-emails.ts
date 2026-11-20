import { APP_NAME, getAppUrl } from "@/lib/app-config";
import { findAccountByEmail } from "@/lib/accounts";
import { sendEmail } from "./client";
import { renderEmail } from "./layout";

/** Email envoyé quand quelqu'un est ajouté à l'équipe d'organisation d'un espace. */
export const sendTeamInvite = async (
  member: { email: string; name: string | null },
  p: { spaceName: string; inviterName: string; inviterEmail: string },
  request?: Request
) => {
  const hasAccount = Boolean(await findAccountByEmail("user", member.email));
  const params = new URLSearchParams({ email: member.email, callbackUrl: "/" });
  if (!hasAccount) params.set("tab", "register");
  const url = `${getAppUrl(request)}/login?${params}`;
  const content = renderEmail({
    preheader: `Vous pouvez maintenant gérer les créneaux et les entretiens de ${p.spaceName}.`,
    heading: `Vous co-organisez avec ${p.spaceName}`,
    paragraphs: [
      member.name ? `Bonjour ${member.name},` : "Bonjour,",
      `${p.inviterName} vous a ajouté·e à l'équipe d'organisation de ${p.spaceName} sur ${APP_NAME}. Vous pouvez modifier les créneaux, gérer les réservations et placer les responsables, comme l'organisateur.`,
      hasAccount
        ? "Connectez-vous avec cette adresse : l'espace de l'équipe s'ouvre directement, ou depuis le menu de votre compte."
        : `Créez votre compte ${APP_NAME} avec cette adresse (ou continuez avec Google ou Discord) pour y accéder.`,
    ],
    cta: { label: hasAccount ? "Ouvrir l'espace" : "Créer mon compte", url },
    footnote: "Utilisez bien cette adresse email : c'est elle qui vous donne accès à l'espace.",
  });
  return sendEmail({
    to: member.email,
    replyTo: p.inviterEmail,
    subject: `${p.inviterName} vous ajoute à l'équipe de ${p.spaceName}`,
    ...content,
    tags: [{ name: "category", value: "team_invite" }],
  });
};
