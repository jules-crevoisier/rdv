import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEventType, updateEventType, deleteEventType } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const eventType = await getEventType(id, session.user.id);
    if (!eventType) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    return NextResponse.json(eventType);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[PUT /api/event-types/[id]] Début de la mise à jour");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[PUT /api/event-types/[id]] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log("[PUT /api/event-types/[id]] Mise à jour du type:", id, "avec les données:", JSON.stringify(body, null, 2));
    
    await updateEventType(id, session.user.id, body);
    console.log("[PUT /api/event-types/[id]] Type mis à jour avec succès");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/event-types/[id]] Erreur:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[DELETE /api/event-types/[id]] Début de la suppression");
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[DELETE /api/event-types/[id]] Erreur: Non autorisé");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[DELETE /api/event-types/[id]] Suppression du type:", id, "pour userId:", session.user.id);
    await deleteEventType(id, session.user.id);
    console.log("[DELETE /api/event-types/[id]] Type supprimé avec succès");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/event-types/[id]] Erreur:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
