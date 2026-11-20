import { after, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { readStaffBody } from "@/lib/staff";
import { sendStaffWelcome } from "@/lib/email/staff-emails";

// Annuaire des responsables d'entretien de l'organisateur connecté.

export async function GET() {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const staff = await prisma.staffMember.findMany({
    where: { userId: ws.ownerId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { appointments: { where: { status: { not: "cancelled" }, startTime: { gte: new Date() } } } } },
    },
  });
  return NextResponse.json(
    staff.map(({ _count, ...s }) => ({ ...s, upcomingCount: _count.appointments }))
  );
}

export async function POST(request: Request) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = readStaffBody(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const staff = await prisma.staffMember.create({ data: { userId: ws.ownerId, ...parsed.data } });
    // Invitation : le responsable apprend qu'il est dans l'équipe et peut créer son compte.
    // Elle part au nom de la personne qui l'ajoute (organisateur ou co-organisateur).
    const hostId = ws.actorId;
    after(async () => {
      const host = await prisma.user.findUnique({ where: { id: hostId }, select: { name: true, email: true } });
      // Pas d'invitation quand l'organisateur s'ajoute lui-même.
      if (host && host.email.toLowerCase() !== staff.email.toLowerCase()) await sendStaffWelcome(staff, host, request).catch((e) => console.error("[staff-welcome]", e));
    });
    return NextResponse.json({ ...staff, upcomingCount: 0 }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Un responsable utilise déjà cette adresse." }, { status: 409 });
    }
    console.error("[POST /api/staff]", error);
    return NextResponse.json({ error: "L'ajout n'a pas abouti." }, { status: 500 });
  }
}
