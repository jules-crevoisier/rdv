import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStaffBody } from "@/lib/staff";

// Annuaire des responsables d'entretien de l'organisateur connecté.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const staff = await prisma.staffMember.findMany({
    where: { userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = readStaffBody(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const staff = await prisma.staffMember.create({ data: { userId: session.user.id, ...parsed.data } });
    return NextResponse.json({ ...staff, upcomingCount: 0 }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Un responsable utilise déjà cette adresse." }, { status: 409 });
    }
    console.error("[POST /api/staff]", error);
    return NextResponse.json({ error: "L'ajout n'a pas abouti." }, { status: 500 });
  }
}
