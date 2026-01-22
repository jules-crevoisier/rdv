import { NextResponse } from "next/server";
import { getPublicEventType } from "@/lib/db";
import { getAvailableTimeSlotsForEventType } from "@/lib/availability-utils";

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
