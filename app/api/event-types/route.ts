import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEventType } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, duration, color, bufferTime, status, requiresApproval, timeSlots } = body;

    if (!name || !description || !duration || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

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

    return NextResponse.json(eventType, { status: 201 });
  } catch (error) {
    console.error("Error creating event type:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
