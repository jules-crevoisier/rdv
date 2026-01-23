import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    // Vérifier que l'utilisateur est authentifié et peut accéder à ce calendrier
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les rendez-vous de l'utilisateur
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { userId },
          { clientId: userId },
          { clientEmail: session.user.email || undefined },
        ],
      },
      include: {
        eventType: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Générer le fichier iCal
    let icalContent = "BEGIN:VCALENDAR\r\n";
    icalContent += "VERSION:2.0\r\n";
    icalContent += "PRODID:-//Reservy//Calendar//FR\r\n";
    icalContent += "CALSCALE:GREGORIAN\r\n";
    icalContent += "METHOD:PUBLISH\r\n";

    appointments.forEach((appointment) => {
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      // Format iCal date: YYYYMMDDTHHMMSSZ
      const formatICalDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };

      icalContent += "BEGIN:VEVENT\r\n";
      icalContent += `UID:${appointment.id}@reservy\r\n`;
      icalContent += `DTSTART:${formatICalDate(startDate)}\r\n`;
      icalContent += `DTEND:${formatICalDate(endDate)}\r\n`;
      icalContent += `SUMMARY:${appointment.eventType.name}\r\n`;
      
      if (appointment.eventType.description) {
        icalContent += `DESCRIPTION:${appointment.eventType.description.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n")}\r\n`;
      }
      
      if (appointment.notes) {
        icalContent += `DESCRIPTION:${appointment.notes.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n")}\r\n`;
      }

      icalContent += `STATUS:${appointment.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}\r\n`;
      icalContent += `CREATED:${formatICalDate(new Date(appointment.createdAt))}\r\n`;
      icalContent += `LAST-MODIFIED:${formatICalDate(new Date(appointment.updatedAt))}\r\n`;
      icalContent += "END:VEVENT\r\n";
    });

    icalContent += "END:VCALENDAR\r\n";

    // Retourner le contenu iCal pour synchronisation (pas de téléchargement)
    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/calendar/[userId]/ical] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du calendrier" },
      { status: 500 }
    );
  }
}
