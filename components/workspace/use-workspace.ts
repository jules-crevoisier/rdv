"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type Space = { id: string; name: string | null; email: string; mine: boolean };
export type WorkspaceInfo = { ownerId: string; isOwner: boolean; current: Space; spaces: Space[] };

// Lu une fois par onglet : toutes les pages partagent la même réponse.
let pending: Promise<WorkspaceInfo | null> | null = null;
const load = () =>
  (pending ??= fetch("/api/workspace")
    .then((r) => (r.ok ? (r.json() as Promise<WorkspaceInfo>) : null))
    .catch(() => null));

export const spaceName = (s: Pick<Space, "name" | "email">) => s.name || s.email;

/** Espace géré (le sien ou celui d'une équipe d'organisation) et changement d'espace. */
export const useWorkspace = () => {
  const { status } = useSession();
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    load().then((w) => active && setWorkspace(w));
    return () => {
      active = false;
    };
  }, [status]);

  return { workspace, loading: status === "loading" || (status === "authenticated" && !workspace) };
};

/** Ouvre un autre espace puis recharge sur le tableau de bord, toutes les données en dépendent. */
export const switchWorkspace = async (ownerId: string) => {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId }),
  });
  if (response.ok) window.location.assign("/");
  return response.ok;
};
