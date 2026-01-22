import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPublicEventType, getAppointments } from "@/lib/db";
import { prisma } from "@/lib/prisma";

// Utiliser Node.js runtime car Prisma n'est pas compatible avec Edge Runtime
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const appointments = await getAppointments(session.user.id);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

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
