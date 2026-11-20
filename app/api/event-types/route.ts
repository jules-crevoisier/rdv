import { NextResponse } from "next/server";
import { getWorkspace } from "@/lib/workspace";
import { createEventType, getEventTypes } from "@/lib/db";

export async function GET(request: Request) {
  try {
    console.log("[GET /api/event-types] Début de la récupération des types de rendez-vous");
    const ws = await getWorkspace();
    console.log("[GET /api/event-types] Session:", ws ? "Authentifié" : "Non authentifié");
    
    if (!ws) {
      console.log("[GET /api/event-types] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("[GET /api/event-types] Récupération des types pour userId:", ws.ownerId);
    const eventTypes = await getEventTypes(ws.ownerId);
    console.log("[GET /api/event-types] Types trouvés:", eventTypes.length);
    console.log("[GET /api/event-types] Détails:", JSON.stringify(eventTypes, null, 2));

    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("[GET /api/event-types] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("[POST /api/event-types] Début de la création d'un type de rendez-vous");
    const ws = await getWorkspace();
    console.log("[POST /api/event-types] Session:", ws ? "Authentifié" : "Non authentifié");
    
    if (!ws) {
      console.log("[POST /api/event-types] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[POST /api/event-types] Données reçues:", JSON.stringify(body, null, 2));
    
    const { name, description, duration, color, bufferTime, status, requiresApproval, location, meetingType, dateOverrides } = body;

    if (!name || !description || !duration) {
      console.log("[POST /api/event-types] Erreur: Données invalides");
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // dateOverrides est optionnel, mais si fourni, doit être un tableau
    if (dateOverrides && !Array.isArray(dateOverrides)) {
      console.log("[POST /api/event-types] Erreur: dateOverrides doit être un tableau");
      return NextResponse.json({ error: "dateOverrides doit être un tableau" }, { status: 400 });
    }

    console.log("[POST /api/event-types] Création du type avec userId:", ws.ownerId);
    const eventType = await createEventType({
      userId: ws.ownerId,
      name,
      description,
      duration: parseInt(duration),
      color,
      bufferTime: parseInt(bufferTime) || 0,
      status: status || "online",
      requiresApproval: requiresApproval || false,
      location: location || null,
      meetingType: meetingType || "in-person",
      dateOverrides: dateOverrides || [],
    });

    console.log("[POST /api/event-types] Type créé avec succès:", eventType.id);
    return NextResponse.json(eventType, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/event-types] Erreur:", error);
    const errorMessage = error?.message || "Erreur lors de la création";
    const errorDetails = process.env.NODE_ENV === "development" ? error?.stack : undefined;
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: error?.code
      }, 
      { status: 500 }
    );
  }
}
