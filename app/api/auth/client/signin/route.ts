import { NextResponse } from "next/server";
import { clientAuth, clientSignIn } from "@/auth-client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // Vérifier les identifiants
    const client = await prisma.client.findUnique({
      where: { email },
    });

    if (!client) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, client.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    // Créer une session en utilisant clientSignIn
    // Note: clientSignIn nécessite un objet Request, donc on va créer la session différemment
    // Pour l'instant, on retourne un token ou on utilise les cookies directement
    
    // Utiliser les handlers NextAuth pour créer la session
    const authRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        email,
        password,
        providerId: "ClientCredentials",
      }),
    });

    // Appeler directement le handler POST de NextAuth
    const { handlers } = await import("@/auth-client");
    const response = await handlers.POST(authRequest as any);

    return response;
  } catch (error) {
    console.error("Client signin error:", error);
    return NextResponse.json({ error: "Erreur lors de la connexion" }, { status: 500 });
  }
}
