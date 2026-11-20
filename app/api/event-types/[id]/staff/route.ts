import { after, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { inPlage, localDateKey, ownStaffIds, plageKey, plagesOf, setAppointmentStaff } from "@/lib/staff";
import { notifyStaffChanged } from "@/lib/email/appointment-emails";

// Planning des entretiens d'un type de rendez-vous : plages horaires, responsables prévus
// sur chacune, et rendez-vous déjà pris avec leurs responsables.

const loadOwned = (id: string, userId: string) =>
  prisma.eventType.findFirst({
    where: { id, userId },
    select: { id: true, name: true, duration: true, color: true, status: true, availability: { select: { dateOverrides: true } } },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const eventType = await loadOwned(id, ws.ownerId);
  if (!eventType) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const today = localDateKey(new Date());
  const [assignments, unavailable, appointments] = await Promise.all([
    prisma.slotStaff.findMany({ where: { eventTypeId: id, date: { gte: today } }, select: { date: true, startTime: true, endTime: true, staffMemberId: true } }),
    prisma.staffUnavailability.findMany({ where: { eventTypeId: id, date: { gte: today } }, select: { date: true, startTime: true, endTime: true, staffMemberId: true } }),
    prisma.appointment.findMany({
      where: { eventTypeId: id, status: { not: "cancelled" }, startTime: { gte: new Date(`${today}T00:00:00`) } },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        clientName: true,
        clientEmail: true,
        status: true,
        staff: { select: { id: true } },
      },
    }),
  ]);

  const byPlage = new Map<string, string[]>();
  for (const a of assignments) {
    const key = plageKey(a);
    byPlage.set(key, [...(byPlage.get(key) ?? []), a.staffMemberId]);
  }
  // Responsables qui ont indiqué ne pas être disponibles sur la plage
  const offByPlage = new Map<string, string[]>();
  for (const u of unavailable) {
    const key = plageKey(u);
    offByPlage.set(key, [...(offByPlage.get(key) ?? []), u.staffMemberId]);
  }

  const plages = plagesOf(eventType.availability?.dateOverrides)
    .filter((p) => p.date >= today)
    .map((p) => ({
      ...p,
      staffIds: byPlage.get(plageKey(p)) ?? [],
      unavailableIds: offByPlage.get(plageKey(p)) ?? [],
      appointments: appointments
        .filter((a) => inPlage(p, a.startTime, a.endTime))
        .map((a) => ({ ...a, staffIds: a.staff.map((s) => s.id), staff: undefined })),
    }));

  // Rendez-vous hors de toute plage (plage modifiée depuis la réservation, par exemple)
  const placed = new Set(plages.flatMap((p) => p.appointments.map((a) => a.id)));
  const outside = appointments
    .filter((a) => !placed.has(a.id))
    .map((a) => ({ ...a, staffIds: a.staff.map((s) => s.id), staff: undefined }));

  const { id: eventTypeId, name, duration, color, status } = eventType;
  return NextResponse.json({ eventType: { id: eventTypeId, name, duration, color, status }, plages, outside });
}

/**
 * Fixe les responsables d'une plage. Les rendez-vous déjà pris dans la plage suivent le changement :
 * les responsables ajoutés y sont invités, les retirés en sont retirés (les ajouts faits à la main restent).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const eventType = await loadOwned(id, ws.ownerId);
  if (!eventType) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const plage = plagesOf(eventType.availability?.dateOverrides).find(
    (p) => p.date === body.date && p.startTime === body.startTime && p.endTime === body.endTime
  );
  if (!plage) return NextResponse.json({ error: "Cette plage n'existe plus. Rechargez la page." }, { status: 404 });

  const staffIds = await ownStaffIds(ws.ownerId, body.staffIds);
  if (!staffIds) return NextResponse.json({ error: "Responsable inconnu" }, { status: 400 });

  const where = { eventTypeId: id, date: plage.date, startTime: plage.startTime, endTime: plage.endTime };
  const before = new Set((await prisma.slotStaff.findMany({ where, select: { staffMemberId: true } })).map((r) => r.staffMemberId));
  const added = staffIds.filter((s) => !before.has(s));
  const removed = [...before].filter((s) => !staffIds.includes(s));

  await prisma.$transaction([
    prisma.slotStaff.deleteMany({ where: { ...where, staffMemberId: { in: removed } } }),
    prisma.slotStaff.createMany({ data: added.map((staffMemberId) => ({ ...where, staffMemberId })), skipDuplicates: true }),
  ]);

  if (added.length || removed.length) {
    const booked = await prisma.appointment.findMany({
      where: { eventTypeId: id, status: { not: "cancelled" }, startTime: { gte: new Date() } },
      select: { id: true, startTime: true, endTime: true, staff: { select: { id: true } } },
    });
    for (const a of booked.filter((a) => inPlage(plage, a.startTime, a.endTime))) {
      const current = a.staff.map((s) => s.id);
      const next = [...new Set([...current.filter((s) => !removed.includes(s)), ...added])];
      const change = await setAppointmentStaff(a.id, next);
      if (change.added.length || change.removed.length) after(() => notifyStaffChanged(a.id, change));
    }
  }

  return NextResponse.json({ success: true, staffIds });
}
