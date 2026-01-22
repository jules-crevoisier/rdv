import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Utiliser Node.js runtime car Prisma n'est pas compatible avec Edge Runtime
export const runtime = "nodejs";

// Route publique pour la confirmation de rendez-vous
// Permet aux clients de voir leur confirmation sans être connectés
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { eventType: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous non trouvé" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}
