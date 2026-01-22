import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPublicEventType, getEventType, updateAvailability } from "@/lib/db";
import { getAvailableTimeSlotsForEventType } from "@/lib/availability-utils";
import type { TimeSlot } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date requise" }, { status: 400 });
    }

    const eventType = await getPublicEventType(id);
    if (!eventType) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const slots = await getAvailableTimeSlotsForEventType(
      {
        id: eventType.id,
        duration: eventType.duration,
        bufferTime: eventType.bufferTime,
      },
      new Date(date)
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[PUT /api/availability/[id]] Début de la mise à jour de la disponibilité");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[PUT /api/availability/[id]] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[PUT /api/availability/[id]] EventTypeId:", id);
    
    // Vérifier que l'eventType appartient à l'utilisateur
    const eventType = await getEventType(id, session.user.id);
    if (!eventType) {
      console.log("[PUT /api/availability/[id]] Erreur: Type de rendez-vous non trouvé");
      return NextResponse.json({ error: "Type de rendez-vous non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    console.log("[PUT /api/availability/[id]] Données reçues:", JSON.stringify(body, null, 2));
    
    const { timeSlots, dateOverrides } = body;

    if (!timeSlots || !Array.isArray(timeSlots)) {
      console.log("[PUT /api/availability/[id]] Erreur: Données invalides");
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    console.log("[PUT /api/availability/[id]] Mise à jour de la disponibilité");
    await updateAvailability(id, timeSlots as TimeSlot[], dateOverrides || []);
    console.log("[PUT /api/availability/[id]] Disponibilité mise à jour avec succès");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/availability/[id]] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
