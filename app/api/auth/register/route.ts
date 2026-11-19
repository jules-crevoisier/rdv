import { registerAccount } from "@/lib/register-account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return await registerAccount("user", request);
  } catch (error) {
    console.error("[register] user:", error);
    return Response.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
