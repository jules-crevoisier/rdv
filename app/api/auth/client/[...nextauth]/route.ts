import { clientHandlers } from "@/auth-client";

// Exporter les handlers NextAuth pour la route /api/auth/client/*
// Ces handlers gèrent automatiquement toutes les routes sous /api/auth/client/*
// y compris /api/auth/client/signin, /api/auth/client/callback, etc.
export const { GET, POST } = clientHandlers;

// S'assurer que le runtime est Node.js (pas Edge)
export const runtime = "nodejs";
