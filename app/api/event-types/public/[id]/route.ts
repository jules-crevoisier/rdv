import { NextResponse } from "next/server";
import { getPublicEventType } from "@/lib/db";

// Utiliser Node.js runtime car Prisma n'est pas compatible avec Edge Runtime
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventType = await getPublicEventType(id);
    if (!eventType) {
      return NextResponse.json({ error: "Non trouvé ou non disponible" }, { status: 404 });
    }

    return NextResponse.json(eventType);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
