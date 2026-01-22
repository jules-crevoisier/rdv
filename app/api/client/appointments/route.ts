import { NextResponse } from "next/server";
import { clientAuth } from "@/auth-client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await clientAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: session.user.id,
      },
      include: {
        eventType: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            color: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching client appointments:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}
