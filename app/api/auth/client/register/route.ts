import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    console.log("[Client Register] Received request:", { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // Vérifier si le client existe déjà
    console.log("[Client Register] Checking if client exists...");
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      console.log("[Client Register] Client already exists");
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 400 });
    }

    // Hasher le mot de passe
    console.log("[Client Register] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le client
    console.log("[Client Register] Creating client...");
    const client = await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
      },
    });

    console.log("[Client Register] Client created successfully:", client.id);

    return NextResponse.json(
      {
        id: client.id,
        email: client.email,
        name: client.name,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Client Register] Error creating client:", error);
    console.error("[Client Register] Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Retourner un message d'erreur plus détaillé en développement
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Erreur lors de la création du compte: ${error?.message || "Erreur inconnue"}`
      : "Erreur lors de la création du compte";
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
