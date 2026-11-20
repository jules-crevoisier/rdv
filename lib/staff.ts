import { prisma } from "./prisma";
import type { TimeSlot } from "./types";

// Responsables d'entretien : un annuaire par organisateur, des affectations par plage horaire
// (date + heures d'une plage de disponibilité) et, au final, par rendez-vous.

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
export const isEmail = (value: string) => EMAIL_RE.test(value);

// Même convention que lib/availability-utils.ts : heures locales du serveur.
const pad = (n: number) => String(n).padStart(2, "0");
export const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export type Plage = { date: string; startTime: string; endTime: string };

export const plageKey = (p: Plage) => `${p.date}|${p.startTime}|${p.endTime}`;

/** Plages de disponibilité (dates ouvertes) d'un type de rendez-vous, triées. */
export const plagesOf = (dateOverrides: string | null | undefined): Plage[] => {
  let overrides: { date: string; available: boolean; timeSlots?: TimeSlot[] }[] = [];
  try {
    overrides = JSON.parse(dateOverrides || "[]");
  } catch {
    overrides = [];
  }
  return overrides
    .filter((o) => o.available && o.timeSlots?.length)
    .flatMap((o) => o.timeSlots!.map((t) => ({ date: o.date, startTime: t.startTime, endTime: t.endTime })))
    .sort((a, b) => plageKey(a).localeCompare(plageKey(b)));
};

/** Le rendez-vous [start, end] tombe-t-il dans cette plage ? */
export const inPlage = (p: Plage, start: Date, end: Date) =>
  localDateKey(start) === p.date && localTime(start) >= p.startTime && localTime(end) <= p.endTime && localDateKey(end) === p.date;

/** Responsables prévus sur la plage qui contient ce créneau. */
export const staffIdsForSlot = async (eventTypeId: string, start: Date, end: Date) => {
  const rows = await prisma.slotStaff.findMany({
    where: { eventTypeId, date: localDateKey(start) },
    select: { staffMemberId: true, date: true, startTime: true, endTime: true },
  });
  return [...new Set(rows.filter((r) => inPlage(r, start, end)).map((r) => r.staffMemberId))];
};

/** Ne garde que les responsables qui appartiennent bien à cet organisateur. */
export const ownStaffIds = async (userId: string, ids: unknown): Promise<string[] | null> => {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) return null;
  const unique = [...new Set(ids as string[])];
  if (unique.length === 0) return [];
  const found = await prisma.staffMember.findMany({ where: { userId, id: { in: unique } }, select: { id: true } });
  return found.length === unique.length ? unique : null;
};

/**
 * Remplace les responsables d'un rendez-vous. Renvoie ceux qui arrivent et ceux qui partent,
 * pour leur envoyer l'invitation ou l'annulation.
 */
export const setAppointmentStaff = async (appointmentId: string, staffIds: string[]) => {
  const current = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { staff: { select: { id: true, name: true, email: true } } },
  });
  if (!current) return { added: [] as string[], removed: [] as { id: string; name: string; email: string }[] };
  const before = new Set(current.staff.map((s) => s.id));
  const after = new Set(staffIds);
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { staff: { set: staffIds.map((id) => ({ id })) } },
  });
  return {
    added: staffIds.filter((id) => !before.has(id)),
    removed: current.staff.filter((s) => !after.has(s.id)),
  };
};

/** Valide le corps d'une création ou modification de responsable. */
export const readStaffBody = (body: Record<string, unknown>) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" && body.role.trim() ? body.role.trim().slice(0, 60) : null;
  if (!name || name.length > 80) return { error: "Indiquez le nom du responsable." } as const;
  if (!isEmail(email)) return { error: "Cette adresse email n'est pas valide." } as const;
  return { data: { name, email, role } } as const;
};
