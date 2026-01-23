import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Générer un token unique
    const token = randomBytes(32).toString("hex");

    // Mettre à jour l'utilisateur avec le nouveau token
    await prisma.user.update({
      where: { id: session.user.id },
      data: { calendarToken: token },
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("[POST /api/calendar/generate-token] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du token" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { calendarToken: true },
    });

    // Si pas de token, en générer un
    if (!user?.calendarToken) {
      const token = randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: session.user.id },
        data: { calendarToken: token },
      });
      return NextResponse.json({ token });
    }

    return NextResponse.json({ token: user.calendarToken });
  } catch (error: any) {
    console.error("[GET /api/calendar/generate-token] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du token" },
      { status: 500 }
    );
  }
}
