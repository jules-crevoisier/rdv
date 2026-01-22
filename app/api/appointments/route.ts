import { NextResponse } from "next/server";
import { getPublicEventType } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventTypeId, startTime, endTime, clientName, clientEmail, clientPhone, notes } = body;

    // Récupérer le type de rendez-vous pour obtenir le userId
    const eventType = await getPublicEventType(eventTypeId);
    if (!eventType) {
      return NextResponse.json({ error: "Type de rendez-vous non trouvé" }, { status: 404 });
    }

    // Déterminer le statut
    const status = eventType.requiresApproval ? "pending" : "confirmed";

    const appointment = await prisma.appointment.create({
      data: {
        userId: eventType.userId,
        eventTypeId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        notes: notes || null,
        status,
      },
      include: { eventType: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
