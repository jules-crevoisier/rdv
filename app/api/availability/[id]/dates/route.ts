import { NextResponse } from "next/server";
import { getPublicEventType } from "@/lib/db";
import { getAvailableTimeSlotsForEventType } from "@/lib/availability-utils";
import { format, addDays, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    const eventType = await getPublicEventType(id);
    if (!eventType) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    // Si un mois est spécifié, utiliser ce mois, sinon utiliser le mois actuel et les 2 suivants
    let startDate: Date;
    let endDate: Date;

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      startDate = startOfMonth(new Date(year, month - 1, 1));
      endDate = endOfMonth(new Date(year, month - 1, 1));
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;
      endDate = addDays(today, 90); // 3 mois à l'avance
    }

    const availableDates: string[] = [];
    const currentDate = new Date(startDate);

    // Vérifier chaque date dans la plage
    while (currentDate <= endDate) {
      const slots = await getAvailableTimeSlotsForEventType(
        {
          id: eventType.id,
          duration: eventType.duration,
          bufferTime: eventType.bufferTime,
        },
        currentDate
      );

      if (slots.length > 0) {
        availableDates.push(format(currentDate, "yyyy-MM-dd"));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({ dates: availableDates });
  } catch (error) {
    console.error("Error getting available dates:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
