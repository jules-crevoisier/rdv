import { APP_NAME, getAppUrl } from "@/lib/app-config";

// Mise en page commune des emails : un email transactionnel simple, comme on en
// reçoit d'un vrai service. Fond blanc, texte aligné à gauche, un seul bouton
// noir (celui de l'app), pas de badge ni de décoration. Tableaux + styles en
// ligne pour passer partout (Gmail, Outlook, Apple Mail).

const C = {
  bg: "#FFFFFF",
  ink: "#18181B",
  muted: "#71717A",
  line: "#E4E4E7",
  button: "#18181B",
  buttonInk: "#FFFFFF",
};

// Guillemets simples : la police est insérée dans des attributs style="..."
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type DetailRow = { label: string; value: string; href?: string };

export type EmailContent = {
  /** Texte d'aperçu affiché par la boîte mail à côté de l'objet. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Récapitulatif d'un rendez-vous : un titre puis des lignes « libellé / valeur ». */
  details?: { title: string; rows: DetailRow[] };
  cta?: { label: string; url: string };
  /** Petit texte sous le bouton (délai d'expiration, consigne...). */
  footnote?: string;
  /** URL de l'app, affichée en pied de page (APP_URL par défaut). */
  appUrl?: string;
};

const renderDetails = (details: NonNullable<EmailContent["details"]>) => {
  const rows = details.rows
    .map(
      (r) => `
      <tr>
        <td width="120" style="padding:4px 12px 4px 0;vertical-align:top;font:400 14px/1.5 ${FONT};color:${C.muted};">${escapeHtml(r.label)}</td>
        <td style="padding:4px 0;vertical-align:top;font:400 14px/1.5 ${FONT};color:${C.ink};">${
          r.href
            ? `<a href="${escapeHtml(r.href)}" style="color:${C.ink};text-decoration:underline;">${escapeHtml(r.value)}</a>`
            : escapeHtml(r.value)
        }</td>
      </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};">
    <tr><td style="padding:16px 0 4px;font:600 15px/1.4 ${FONT};color:${C.ink};">${escapeHtml(details.title)}</td></tr>
    <tr><td style="padding:0 0 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export const renderEmail = (content: EmailContent): { html: string; text: string } => {
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 12px;font:400 15px/1.6 ${FONT};color:${C.ink};">${escapeHtml(p)}</p>`)
    .join("");

  const cta = content.cta
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;">
      <tr><td style="border-radius:6px;background:${C.button};">
        <a href="${escapeHtml(content.cta.url)}" style="display:inline-block;padding:10px 18px;font:500 14px/1.4 ${FONT};color:${C.buttonInk};text-decoration:none;border-radius:6px;">${escapeHtml(content.cta.label)}</a>
      </td></tr>
    </table>`
    : "";

  const footnote = content.footnote
    ? `<p style="margin:16px 0 0;font:400 13px/1.6 ${FONT};color:${C.muted};">${escapeHtml(content.footnote)}</p>`
    : "";

  const appUrl = content.appUrl ?? getAppUrl();
  const footerLink = ` · <a href="${escapeHtml(appUrl)}" style="color:${C.muted};text-decoration:underline;">${escapeHtml(hostOf(appUrl))}</a>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
  <tr><td style="padding:32px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="padding:0 0 24px;font:600 14px/1 ${FONT};color:${C.ink};">${escapeHtml(APP_NAME)}</td></tr>
      <tr><td>
        <h1 style="margin:0 0 16px;font:600 20px/1.35 ${FONT};color:${C.ink};">${escapeHtml(content.heading)}</h1>
        ${paragraphs}
        ${content.details ? renderDetails(content.details) : ""}
        ${cta}
        ${footnote}
      </td></tr>
      <tr><td style="padding:32px 0 0;">
        <p style="margin:0;padding:16px 0 0;border-top:1px solid ${C.line};font:400 12px/1.6 ${FONT};color:${C.muted};">${escapeHtml(APP_NAME)}${footerLink}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const textParts = [content.heading, "", ...content.paragraphs];
  if (content.details) {
    const d = content.details;
    textParts.push(
      "",
      d.title,
      ...d.rows.map((r) => `${r.label} : ${r.value}${r.href && !r.href.startsWith("mailto:") && !r.href.startsWith("tel:") && r.href !== r.value ? ` (${r.href})` : ""}`)
    );
  }
  if (content.cta) textParts.push("", `${content.cta.label} : ${content.cta.url}`);
  if (content.footnote) textParts.push("", content.footnote);
  textParts.push("", "--", `${APP_NAME} · ${appUrl}`);

  return { html, text: textParts.join("\n") };
};
