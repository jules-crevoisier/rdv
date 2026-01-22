import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEventType, getEventTypes } from "@/lib/db";

// Utiliser Node.js runtime car Prisma n'est pas compatible avec Edge Runtime
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    console.log("[GET /api/event-types] Début de la récupération des types de rendez-vous");
    const session = await auth();
    console.log("[GET /api/event-types] Session:", session ? "Authentifié" : "Non authentifié");
    
    if (!session?.user?.id) {
      console.log("[GET /api/event-types] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("[GET /api/event-types] Récupération des types pour userId:", session.user.id);
    const eventTypes = await getEventTypes(session.user.id);
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
    const session = await auth();
    console.log("[POST /api/event-types] Session:", session ? "Authentifié" : "Non authentifié");
    
    if (!session?.user?.id) {
      console.log("[POST /api/event-types] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[POST /api/event-types] Données reçues:", JSON.stringify(body, null, 2));
    
    const { name, description, duration, color, bufferTime, status, requiresApproval, timeSlots } = body;

    if (!name || !description || !duration || !timeSlots || !Array.isArray(timeSlots)) {
      console.log("[POST /api/event-types] Erreur: Données invalides");
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    console.log("[POST /api/event-types] Création du type avec userId:", session.user.id);
    const eventType = await createEventType({
      userId: session.user.id,
      name,
      description,
      duration: parseInt(duration),
      color,
      bufferTime: parseInt(bufferTime) || 0,
      status: status || "online",
      requiresApproval: requiresApproval || false,
      timeSlots,
    });

    console.log("[POST /api/event-types] Type créé avec succès:", eventType.id);
    return NextResponse.json(eventType, { status: 201 });
  } catch (error) {
    console.error("[POST /api/event-types] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
