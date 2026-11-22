import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Flux lu par le bot Discord NDS : les entretiens à venir d'un type de rendez-vous, avec leurs responsables.
// GET /api/integrations/entretiens?event=Entretien%20NDS
// En-tête `Authorization: Bearer $INTEGRATION_TOKEN`. Ni email ni téléphone des candidats.
const authorized = (request: Request) => {
  const secret = process.env.INTEGRATION_TOKEN;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("event")?.trim();
  if (!query) return NextResponse.json({ error: "Paramètre event manquant" }, { status: 400 });

  try {
    const eventTypes = await prisma.eventType.findMany({
      where: { OR: [{ id: query }, { name: { equals: query, mode: "insensitive" } }], status: { not: "archived" } },
      select: { id: true, name: true, location: true },
    });
    if (eventTypes.length === 0) return NextResponse.json({ error: "Type de rendez-vous introuvable" }, { status: 404 });

    // Depuis le début de la journée : un entretien en cours reste affiché.
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: { eventTypeId: { in: eventTypes.map((e) => e.id) }, status: { not: "cancelled" }, startTime: { gte: since } },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        clientName: true,
        location: true,
        meetingType: true,
        eventTypeId: true,
        staff: { select: { name: true, email: true, role: true }, orderBy: { name: "asc" } },
      },
    });

    const locationOf = new Map(eventTypes.map((e) => [e.id, e.location]));
    return NextResponse.json({
      event: { id: eventTypes[0].id, name: eventTypes[0].name },
      generatedAt: new Date().toISOString(),
      interviews: appointments.map((a) => ({
        id: a.id,
        start: a.startTime.toISOString(),
        end: a.endTime.toISOString(),
        status: a.status,
        candidate: a.clientName,
        location: a.meetingType === "video" ? "Visio" : a.location || locationOf.get(a.eventTypeId) || null,
        staff: a.staff,
      })),
    });
  } catch (error) {
    console.error("[integrations/entretiens]", error);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}
