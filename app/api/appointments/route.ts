import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPublicEventType, getAppointments } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Passer aussi l'email pour rechercher les rendez-vous par email
    const appointments = await getAppointments(session.user.id, session.user.email || undefined);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventTypeId, startTime, endTime, clientName, clientEmail, clientPhone, notes, location, meetingType } = body;

    // Récupérer le type de rendez-vous pour obtenir le userId
    const eventType = await getPublicEventType(eventTypeId);
    if (!eventType) {
      return NextResponse.json({ error: "Type de rendez-vous non trouvé" }, { status: 404 });
    }

    // Vérifier si un client est connecté (Client uniquement, pas User)
    // Note: clientId référence le modèle Client, pas User
    // Pour les Users, on utilisera l'email pour faire le lien dans getAppointments
    let clientId: string | null = null;
    
    try {
      const { clientAuth } = await import("@/auth-client");
      const clientSession = await clientAuth();
      // Si une session client existe, vérifier que le client existe vraiment dans la DB
      if (clientSession?.user?.id) {
        const clientExists = await prisma.client.findUnique({
          where: { id: clientSession.user.id },
          select: { id: true },
        });
        if (clientExists) {
          clientId = clientSession.user.id;
        }
      }
    } catch (error) {
      // Pas de session client ou erreur, continuer sans lier
      console.error("[POST /api/appointments] Error checking client session:", error);
    }

    // Déterminer le statut
    const status = eventType.requiresApproval ? "pending" : "confirmed";

    // Déterminer le type de rendez-vous (utiliser celui fourni ou celui de l'EventType)
    const finalMeetingType = meetingType || eventType.meetingType || "in-person";
    
    // Déterminer le lieu (utiliser celui fourni ou celui de l'EventType)
    const finalLocation = location || eventType.location || null;

    // Générer un lien de visioconférence automatiquement si c'est un rendez-vous en distanciel
    let videoLink: string | null = null;
    if (finalMeetingType === "video") {
      // Si un lien personnalisé est fourni dans le champ location, l'utiliser
      if (finalLocation && (finalLocation.startsWith("http://") || finalLocation.startsWith("https://"))) {
        videoLink = finalLocation;
      } else {
        // Sinon, générer un lien Jitsi Meet (alternative open source à Google Meet)
        // Jitsi permet de générer des liens valides facilement
        const generateJitsiRoomName = () => {
          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          return Array.from({ length: 22 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        };
        const roomName = generateJitsiRoomName();
        videoLink = `https://meet.jit.si/${roomName}`;
        
        // Note: Pour utiliser Google Meet, il faudrait intégrer l'API Google Calendar
        // et créer un événement avec conferenceData pour obtenir un lien Meet valide
      }
    }

    // Préparer les données de création
    const appointmentData: any = {
      userId: eventType.userId,
      eventTypeId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      clientName,
      clientEmail,
      clientPhone: clientPhone || null,
      notes: notes || null,
      location: finalLocation,
      meetingType: finalMeetingType,
      videoLink,
      status,
    };

    // N'ajouter clientId que s'il est valide (non null et existe dans la DB)
    if (clientId) {
      appointmentData.clientId = clientId;
    }

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: { eventType: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    
    // Gérer spécifiquement l'erreur de contrainte de clé étrangère
    if (error?.code === "P2003") {
      console.error("Foreign key constraint error - clientId might be invalid:", error);
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du rendez-vous. Veuillez réessayer.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      }, 
      { status: 500 }
    );
  }
}
