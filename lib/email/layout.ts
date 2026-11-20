import { APP_NAME } from "@/lib/app-config";

// Mise en page commune des emails : tableaux + styles en ligne, pour passer
// partout (Gmail, Outlook, Apple Mail). Fond papier, encre sombre, un seul accent.

const C = {
  paper: "#F4F1EA",
  card: "#FFFFFF",
  ink: "#1C1B19",
  muted: "#6B675F",
  line: "#E4DFD4",
  accent: "#1F5F4A",
  accentInk: "#FFFFFF",
  tear: "#C8492C",
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

export type DateTile = { month: string; day: string; weekday: string; time: string };

export type TicketRow = { label: string; value: string; href?: string };

export type EmailContent = {
  /** Texte d'aperçu affiché par la boîte mail à côté de l'objet. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Un rendez-vous : affiché comme un ticket avec une page de calendrier détachable. */
  ticket?: { tile: DateTile; title: string; rows: TicketRow[]; stamp?: { label: string; tone: "ok" | "wait" | "off" } };
  cta?: { label: string; url: string };
  /** Petit texte sous le bouton (lien en clair, délai d'expiration...). */
  footnote?: string;
};

const stampColors = {
  ok: { bg: "#E3EFE9", fg: "#1F5F4A" },
  wait: { bg: "#F6ECD8", fg: "#8A5A12" },
  off: { bg: "#F5E1DB", fg: "#9A3A22" },
};

const renderTicket = (ticket: NonNullable<EmailContent["ticket"]>) => {
  const { tile } = ticket;
  const rows = ticket.rows
    .map(
      (r) => `
      <tr>
        <td style="padding:7px 0;vertical-align:top;">
          <div style="font:600 11px/1.4 ${FONT};color:${C.muted};text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(r.label)}</div>
          <div style="font:400 15px/1.5 ${FONT};color:${C.ink};">${
            r.href
              ? `<a href="${escapeHtml(r.href)}" style="color:${C.accent};text-decoration:underline;">${escapeHtml(r.value)}</a>`
              : escapeHtml(r.value)
          }</div>
        </td>
      </tr>`
    )
    .join("");

  const stamp = ticket.stamp
    ? `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${stampColors[ticket.stamp.tone].bg};color:${stampColors[ticket.stamp.tone].fg};font:600 12px/1.4 ${FONT};letter-spacing:.02em;">${escapeHtml(ticket.stamp.label)}</span>`
    : "";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;border:1px solid ${C.line};border-radius:14px;border-collapse:separate;">
    <tr>
      <td width="108" style="padding:20px 0 20px 18px;vertical-align:top;">
        <!-- Page de calendrier détachable -->
        <table role="presentation" width="92" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${C.line};border-radius:10px;overflow:hidden;">
          <tr><td align="center" style="background:${C.tear};color:#fff;font:700 11px/1 ${FONT};letter-spacing:.14em;text-transform:uppercase;padding:7px 0;border-radius:9px 9px 0 0;">${escapeHtml(tile.month)}</td></tr>
          <tr><td align="center" style="background:${C.card};color:${C.ink};font:700 38px/1 ${FONT};padding:10px 0 2px;">${escapeHtml(tile.day)}</td></tr>
          <tr><td align="center" style="background:${C.card};color:${C.muted};font:500 11px/1 ${FONT};text-transform:capitalize;padding:0 0 8px;">${escapeHtml(tile.weekday)}</td></tr>
          <tr><td align="center" style="background:${C.paper};color:${C.ink};font:600 14px/1 ${FONT};padding:8px 0;border-top:1px dashed ${C.line};border-radius:0 0 9px 9px;">${escapeHtml(tile.time)}</td></tr>
        </table>
      </td>
      <td style="padding:20px 18px 14px 14px;vertical-align:top;">
        ${stamp}
        <div style="font:700 18px/1.3 ${FONT};color:${C.ink};margin:${stamp ? "10px" : "0"} 0 6px;">${escapeHtml(ticket.title)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>
  </table>`;
};

export const renderEmail = (content: EmailContent): { html: string; text: string } => {
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font:400 16px/1.6 ${FONT};color:${C.ink};">${escapeHtml(p)}</p>`)
    .join("");

  const cta = content.cta
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr><td style="border-radius:10px;background:${C.accent};">
        <a href="${escapeHtml(content.cta.url)}" style="display:inline-block;padding:14px 22px;font:600 15px/1 ${FONT};color:${C.accentInk};text-decoration:none;border-radius:10px;">${escapeHtml(content.cta.label)}</a>
      </td></tr>
    </table>`
    : "";

  const footnote = content.footnote
    ? `<p style="margin:16px 0 0;font:400 13px/1.6 ${FONT};color:${C.muted};">${escapeHtml(content.footnote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 4px 18px;font:700 15px/1 ${FONT};color:${C.ink};letter-spacing:-.01em;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${C.tear};margin-right:8px;vertical-align:-1px;"></span>${escapeHtml(APP_NAME)}
      </td></tr>
      <tr><td style="background:${C.card};border-radius:18px;padding:36px 32px;border:1px solid ${C.line};">
        <h1 style="margin:0 0 16px;font:700 24px/1.25 ${FONT};color:${C.ink};letter-spacing:-.015em;">${escapeHtml(content.heading)}</h1>
        ${paragraphs}
        ${content.ticket ? renderTicket(content.ticket) : ""}
        ${cta}
        ${footnote}
      </td></tr>
      <tr><td style="padding:18px 4px 0;font:400 12px/1.6 ${FONT};color:${C.muted};">
        Email envoyé automatiquement par ${escapeHtml(APP_NAME)}. Si vous n'êtes pas à l'origine de cette action, vous pouvez l'ignorer.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const textParts = [content.heading, "", ...content.paragraphs];
  if (content.ticket) {
    const t = content.ticket;
    textParts.push(
      "",
      `${t.title}${t.stamp ? ` (${t.stamp.label})` : ""}`,
      `${t.tile.weekday} ${t.tile.day} ${t.tile.month}, ${t.tile.time}`,
      ...t.rows.map((r) => `${r.label} : ${r.value}${r.href && r.href !== r.value ? ` (${r.href})` : ""}`)
    );
  }
  if (content.cta) textParts.push("", `${content.cta.label} : ${content.cta.url}`);
  if (content.footnote) textParts.push("", content.footnote);
  textParts.push("", `${APP_NAME}`);

  return { html, text: textParts.join("\n") };
};
