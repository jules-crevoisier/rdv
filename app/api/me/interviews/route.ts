import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Entretiens confiés au compte connecté : les rendez-vous où un organisateur l'a placé comme
// responsable, retrouvés par son adresse email (vérifiée, pour qu'on ne puisse pas s'en attribuer d'autres).

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerified: true } });
  if (!me?.emailVerified) return NextResponse.json({ verified: false, count: 0, interviews: [] });

  const where = {
    status: { not: "cancelled" },
    staff: { some: { email: { equals: me.email, mode: "insensitive" as const } } },
  };

  // ?count=1 : juste le nombre à venir, pour afficher ou non l'onglet dans la navigation.
  if (new URL(request.url).searchParams.get("count")) {
    const count = await prisma.appointment.count({ where: { ...where, endTime: { gte: new Date() } } });
    return NextResponse.json({ verified: true, count });
  }

  const interviews = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      notes: true,
      location: true,
      meetingType: true,
      videoLink: true,
      status: true,
      eventType: { select: { name: true, color: true, location: true } },
      user: { select: { name: true, email: true } },
      staff: { select: { id: true, name: true, role: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({
    verified: true,
    count: interviews.length,
    interviews: interviews.map(({ staff, user, _count, ...a }) => ({
      ...a,
      commentCount: _count.comments,
      organizer: user.name || user.email,
      // Les autres responsables du même entretien, sans leurs adresses.
      team: staff
        .filter((s) => s.email.toLowerCase() !== me.email.toLowerCase())
        .map((s) => ({ id: s.id, name: s.name, role: s.role })),
    })),
  });
}
