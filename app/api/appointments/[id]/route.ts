import { after, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppointment, updateAppointment, deleteAppointment } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { notifyAppointmentDeleted, notifyAppointmentUpdated } from "@/lib/email/appointment-emails";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await getAppointment(id, session.user.id);

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous non trouvé" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const previous = await prisma.appointment.findFirst({
      where: { id, userId: session.user.id },
      select: { status: true, startTime: true },
    });

    const result = await updateAppointment(id, session.user.id, {
      status: body.status,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    });

    if (previous && result.count > 0) {
      after(() => notifyAppointmentUpdated(id, previous, request));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    // Copie avant suppression, pour prévenir l'autre partie par email
    const snapshot = await prisma.appointment.findUnique({
      where: { id },
      include: {
        eventType: { select: { id: true, name: true, duration: true } },
        user: { select: { name: true, email: true } },
      },
    });
    const result = await deleteAppointment(id, session.user.id, session.user.email || undefined);

    // Vérifier si un rendez-vous a été supprimé
    if (result.count === 0) {
      return NextResponse.json({ error: "Rendez-vous non trouvé ou vous n'avez pas la permission de le supprimer" }, { status: 404 });
    }

    if (snapshot) {
      const deletedBy = snapshot.userId === session.user.id ? "pro" : "client";
      after(() => notifyAppointmentDeleted(snapshot, deletedBy, request));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
