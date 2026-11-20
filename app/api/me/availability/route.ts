import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { localDateKey, plageKey, plagesOf } from "@/lib/staff";

// Disponibilités d'un responsable : pour chaque organisateur qui l'a dans son annuaire (même adresse
// vérifiée), les plages à venir de ses types de rendez-vous, avec celles où il s'est dit indisponible.

const myStaffRecords = async (userId: string) => {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!me?.emailVerified) return null;
  return prisma.staffMember.findMany({
    where: { email: { equals: me.email, mode: "insensitive" } },
    select: { id: true, userId: true, user: { select: { name: true, email: true } } },
  });
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const records = await myStaffRecords(session.user.id);
  if (!records) return NextResponse.json({ verified: false, spaces: [] });

  const today = localDateKey(new Date());
  const spaces = await Promise.all(
    records.map(async (r) => {
      const [eventTypes, off, assigned] = await Promise.all([
        prisma.eventType.findMany({
          where: { userId: r.userId, status: { notIn: ["archived", "closed"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, color: true, availability: { select: { dateOverrides: true } } },
        }),
        prisma.staffUnavailability.findMany({ where: { staffMemberId: r.id, date: { gte: today } } }),
        prisma.slotStaff.findMany({ where: { staffMemberId: r.id, date: { gte: today } } }),
      ]);
      const offKeys = new Set(off.map((o) => `${o.eventTypeId}|${plageKey(o)}`));
      const assignedKeys = new Set(assigned.map((a) => `${a.eventTypeId}|${plageKey(a)}`));
      return {
        staffMemberId: r.id,
        organizer: r.user.name || r.user.email,
        eventTypes: eventTypes
          .map((et) => ({
            id: et.id,
            name: et.name,
            color: et.color,
            plages: plagesOf(et.availability?.dateOverrides)
              .filter((p) => p.date >= today)
              .map((p) => ({
                ...p,
                unavailable: offKeys.has(`${et.id}|${plageKey(p)}`),
                assigned: assignedKeys.has(`${et.id}|${plageKey(p)}`),
              })),
          }))
          .filter((et) => et.plages.length > 0),
      };
    })
  );

  return NextResponse.json({ verified: true, spaces: spaces.filter((s) => s.eventTypes.length > 0) });
}

/** { staffMemberId, eventTypeId, date, startTime, endTime, unavailable } */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const records = await myStaffRecords(session.user.id);
  const body = await request.json().catch(() => ({}));
  const record = records?.find((r) => r.id === body.staffMemberId);
  if (!record) return NextResponse.json({ error: "Responsable introuvable" }, { status: 404 });

  const eventType = await prisma.eventType.findFirst({
    where: { id: String(body.eventTypeId ?? ""), userId: record.userId },
    select: { availability: { select: { dateOverrides: true } } },
  });
  const plage = eventType && plagesOf(eventType.availability?.dateOverrides).find(
    (p) => p.date === body.date && p.startTime === body.startTime && p.endTime === body.endTime
  );
  if (!plage) return NextResponse.json({ error: "Cette plage n'existe plus. Rechargez la page." }, { status: 404 });

  const where = { staffMemberId: record.id, eventTypeId: String(body.eventTypeId), ...plage };
  if (body.unavailable) {
    await prisma.staffUnavailability.createMany({ data: [where], skipDuplicates: true });
  } else {
    await prisma.staffUnavailability.deleteMany({ where });
  }
  return NextResponse.json({ success: true, unavailable: Boolean(body.unavailable) });
}
