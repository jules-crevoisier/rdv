import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Trouver l'utilisateur par son token de calendrier
    const user = await prisma.user.findUnique({
      where: { calendarToken: token },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 404 });
    }

    // Récupérer tous les rendez-vous de l'utilisateur
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { userId: user.id },
          { clientId: user.id },
          { clientEmail: user.email || undefined },
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
    // Calculer un timestamp pour forcer la mise à jour
    const lastModified = appointments.length > 0 
      ? new Date(Math.max(...appointments.map(a => new Date(a.updatedAt).getTime())))
      : new Date();
    
    let icalContent = "BEGIN:VCALENDAR\r\n";
    icalContent += "VERSION:2.0\r\n";
    icalContent += "PRODID:-//Reservy//Calendar//FR\r\n";
    icalContent += "CALSCALE:GREGORIAN\r\n";
    icalContent += "METHOD:PUBLISH\r\n";
    icalContent += "X-WR-CALNAME:Reservy - Mes rendez-vous\r\n";
    icalContent += "X-WR-CALDESC:Calendrier de rendez-vous Reservy\r\n";
    icalContent += `X-WR-TIMEZONE:Europe/Paris\r\n`;

    appointments.forEach((appointment) => {
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      // Format iCal date: YYYYMMDDTHHMMSSZ
      const formatICalDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };

      // Formater la date et l'heure en français
      const formatDateTime = (date: Date) => {
        return date.toLocaleString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      // Déterminer si c'est un rendez-vous pris par l'utilisateur ou reçu
      const isAppointmentTaken = (appointment.clientId === user.id) || 
                                  (appointment.clientEmail === user.email && appointment.userId !== user.id);
      
      // Utiliser le nom du client comme titre de l'événement
      const summary = appointment.clientName || appointment.eventType.name;
      
      // Construire la description avec tous les détails
      let description = "";
      
      if (isAppointmentTaken) {
        // Rendez-vous pris par l'utilisateur
        description += `[Rendez-vous pris]\r\n`;
        description += `Vous avez un rendez-vous\r\n`;
      } else {
        // Rendez-vous reçu (créé par l'utilisateur)
        description += `[Rendez-vous reçu]\r\n`;
        description += `Client: ${appointment.clientName}\r\n`;
        description += `Email: ${appointment.clientEmail}\r\n`;
        if (appointment.clientPhone) {
          description += `Téléphone: ${appointment.clientPhone}\r\n`;
        }
      }
      
      description += `Type de rendez-vous: ${appointment.eventType.name}\r\n`;
      description += `Date et heure: ${formatDateTime(startDate)}\r\n`;
      description += `Durée: ${formatTime(startDate)} - ${formatTime(endDate)}\r\n`;
      
      // Ajouter le lieu si disponible
      if (appointment.location) {
        description += `Lieu: ${appointment.location}\r\n`;
      }
      
      // Ajouter le lien visio si disponible
      if (appointment.videoLink) {
        description += `Lien de visioconférence: ${appointment.videoLink}\r\n`;
      }
      
      if (appointment.eventType.description) {
        description += `\r\n${appointment.eventType.description}\r\n`;
      }
      
      if (appointment.notes) {
        description += `\r\nNotes: ${appointment.notes}\r\n`;
      }

      icalContent += "BEGIN:VEVENT\r\n";
      icalContent += `UID:${appointment.id}@reservy\r\n`;
      icalContent += `DTSTART:${formatICalDate(startDate)}\r\n`;
      icalContent += `DTEND:${formatICalDate(endDate)}\r\n`;
      icalContent += `SUMMARY:${summary.replace(/[,;\\]/g, "")}\r\n`;
      icalContent += `DESCRIPTION:${description.replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")}\r\n`;
      
      // Ajouter le champ LOCATION dans le format iCal standard
      if (appointment.location) {
        icalContent += `LOCATION:${appointment.location.replace(/[,;\\]/g, "")}\r\n`;
      }
      
      // Ajouter le lien visio comme URL si disponible
      if (appointment.videoLink) {
        icalContent += `URL:${appointment.videoLink}\r\n`;
      }

      icalContent += `STATUS:${appointment.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}\r\n`;
      icalContent += `CREATED:${formatICalDate(new Date(appointment.createdAt))}\r\n`;
      icalContent += `LAST-MODIFIED:${formatICalDate(new Date(appointment.updatedAt))}\r\n`;
      icalContent += "END:VEVENT\r\n";
    });

    icalContent += "END:VCALENDAR\r\n";

    // Retourner le contenu iCal pour synchronisation (pas de téléchargement)
    // Headers optimisés pour la synchronisation avec Google Calendar
    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Last-Modified": lastModified.toUTCString(),
        "ETag": `"${lastModified.getTime()}"`,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/calendar/public/[token]/ical] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du calendrier" },
      { status: 500 }
    );
  }
}
