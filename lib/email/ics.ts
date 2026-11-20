import { APP_NAME } from "@/lib/app-config";
import type { AppointmentForEmail } from "./templates";

// Invitation calendrier (RFC 5545) jointe aux emails de rendez-vous.
// Le même UID est réutilisé : un report ou une annulation met à jour l'événement existant.

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const icsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Coupe les lignes à 75 octets comme l'exige la norme. */
const fold = (line: string) => {
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf-8") > 74) {
      out.push(current);
      current = " " + char;
    } else current += char;
  }
  out.push(current);
  return out.join("\r\n");
};

const attendee = (name: string, email: string) =>
  `ATTENDEE;CN="${name.replace(/["\r\n]/g, "")}";ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${email}`;

export const appointmentIcs = (
  a: AppointmentForEmail,
  opts: { cancelled?: boolean; sequence?: number; summary?: string } = {}
) => {
  const host = a.user.name || a.user.email;
  const where = a.meetingType === "video" ? a.videoLink || "Visio" : a.location || "";
  const description = [
    `Rendez-vous avec ${host}`,
    a.meetingType === "video" && a.videoLink ? `Visio : ${a.videoLink}` : "",
    a.notes ? `Note : ${a.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//RDV//FR`,
    "CALSCALE:GREGORIAN",
    `METHOD:${opts.cancelled ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${a.id}@${APP_NAME.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `SEQUENCE:${opts.sequence ?? Math.floor(Date.now() / 1000)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(a.startTime)}`,
    `DTEND:${icsDate(a.endTime)}`,
    `SUMMARY:${icsText(opts.summary ?? `${a.eventType.name} avec ${host}`)}`,
    `DESCRIPTION:${icsText(description)}`,
    where ? `LOCATION:${icsText(where)}` : "",
    a.meetingType === "video" && a.videoLink ? `URL:${a.videoLink}` : "",
    // Entretien : tout le monde voit qui est présent
    ...(a.staff?.length
      ? [attendee(a.clientName, a.clientEmail), ...a.staff.map((s) => attendee(s.name, s.email))]
      : []),
    `STATUS:${opts.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel",
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return {
    filename: opts.cancelled ? "annulation.ics" : "rendez-vous.ics",
    content: lines.map(fold).join("\r\n") + "\r\n",
    contentType: `text/calendar; charset=utf-8; method=${opts.cancelled ? "CANCEL" : "PUBLISH"}`,
  };
};
