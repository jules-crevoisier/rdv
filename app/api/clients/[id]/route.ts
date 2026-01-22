import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Récupérer un client spécifique (admin uniquement)
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
    
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            eventType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("[GET /api/clients/[id]] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération du client" }, { status: 500 });
  }
}

// PUT - Mettre à jour un client (admin uniquement)
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
    const { email, password, name, phone } = body;

    const updateData: any = {};
    
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("[PUT /api/clients/[id]] Error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }
    
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development" 
          ? `Erreur lors de la mise à jour: ${error?.message || "Erreur inconnue"}`
          : "Erreur lors de la mise à jour"
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un client (admin uniquement)
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
    
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/clients/[id]] Error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
