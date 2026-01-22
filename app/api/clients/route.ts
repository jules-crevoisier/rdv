import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Liste tous les clients (admin uniquement)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("[GET /api/clients] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des clients" }, { status: 500 });
  }
}

// POST - Créer un nouveau client (admin uniquement)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // Vérifier si le client existe déjà
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le client
    const client = await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/clients] Error:", error);
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development" 
          ? `Erreur lors de la création du client: ${error?.message || "Erreur inconnue"}`
          : "Erreur lors de la création du client"
      }, 
      { status: 500 }
    );
  }
}
