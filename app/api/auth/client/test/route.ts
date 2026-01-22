import { NextResponse } from "next/server";
import { clientAuth } from "@/auth-client";

export async function GET() {
  try {
    const session = await clientAuth();
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: session.user,
        expires: session.expires,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
