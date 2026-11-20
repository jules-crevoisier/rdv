"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogOut, Mail, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { staffInitials } from "@/components/staff/staff-picker";
import { spaceName, useWorkspace } from "@/components/workspace/use-workspace";

type Owner = { id: string; name: string | null; email: string; isMe: boolean };
type Member = { id: string; name: string | null; email: string; active: boolean; isMe: boolean };
type Team = { owner: Owner | null; members: Member[] };

const Avatar = ({ name, email }: { name: string | null; email: string }) => (
  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium" aria-hidden="true">
    {staffInitials(name || email)}
  </span>
);

const Tag = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "wait" }) => (
  <span
    className={
      tone === "wait"
        ? "inline-flex h-6 items-center rounded-full bg-warning/12 px-2 text-xs font-medium text-warning"
        : "inline-flex h-6 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground"
    }
  >
    {children}
  </span>
);

export default function OrganizersPage() {
  const { data: session } = useSession();
  const { workspace } = useWorkspace();
  const [team, setTeam] = useState<Team | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", name: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/team")
        .then((r) => (r.ok ? r.json() : { owner: null, members: [] }))
        .then((t: Team) => setTeam(t))
        .catch(() => setTeam({ owner: null, members: [] })),
    []
  );

  useEffect(() => {
    if (session?.user) load();
  }, [session?.user, load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(data.error || "L'ajout n'a pas abouti.");
        return;
      }
      setTeam(data);
      setAdding(false);
    } catch {
      setFormError("Connexion perdue. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!toRemove) return;
    setRemoveError(null);
    const response = await fetch(`/api/team/${toRemove.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setRemoveError(data.error || "Le retrait n'a pas abouti.");
      return;
    }
    // Qui quitte l'équipe revient dans son propre espace.
    if (data.left) {
      window.location.assign("/");
      return;
    }
    setToRemove(null);
    load();
  };

  if (!team) {
    return (
      <MainLayout>
        <PageSkeleton rows={3} />
      </MainLayout>
    );
  }

  const { owner, members } = team;
  const count = members.length + (owner ? 1 : 0);
  const ownerLabel = owner ? (owner.isMe ? "votre espace" : `l'espace de ${spaceName(owner)}`) : "cet espace";

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`${count} organisateur${count > 1 ? "s" : ""}`}
          title="Équipe d'organisation"
          description={`Les organisateurs gèrent ${ownerLabel} comme le propriétaire : créneaux, réservations, responsables et cette équipe. Les responsables, eux, assistent aux entretiens.`}
          actions={
            <Button
              onClick={() => {
                setForm({ email: "", name: "" });
                setFormError(null);
                setAdding(true);
              }}
            >
              <Plus />
              Ajouter un organisateur
            </Button>
          }
        />

        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {owner && (
            <li className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
              <Avatar name={owner.name} email={owner.email} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                  <span className="truncate">{owner.name || owner.email}</span>
                  {owner.isMe && <span className="text-sm font-normal text-muted-foreground">(vous)</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{owner.email}</p>
              </div>
              <Tag>Propriétaire</Tag>
            </li>
          )}
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
              <Avatar name={m.name} email={m.email} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                  <span className="truncate">{m.name || m.email}</span>
                  {m.isMe && <span className="text-sm font-normal text-muted-foreground">(vous)</span>}
                </p>
                <a href={`mailto:${m.email}`} className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{m.email}</span>
                </a>
              </div>
              {!m.active && <Tag tone="wait">En attente du compte</Tag>}
              {m.isMe ? (
                <Button variant="ghost" size="sm" onClick={() => setToRemove(m)}>
                  <LogOut />
                  <span className="hidden sm:inline">Quitter</span>
                </Button>
              ) : (
                <Button variant="ghost" size="icon-sm" onClick={() => setToRemove(m)} aria-label={`Retirer ${m.name || m.email}`}>
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {members.length === 0 && (
          <p className="max-w-prose text-sm text-muted-foreground">
            Vous êtes seul à gérer cet espace. Ajoutez les personnes qui organisent avec vous : elles reçoivent un email et, une fois
            connectées avec cette adresse, voient les mêmes créneaux et réservations que vous.
          </p>
        )}

        {workspace && workspace.spaces.length > 1 && (
          <p className="text-sm text-muted-foreground">
            Vous faites partie de plusieurs équipes : changez d&apos;espace depuis le menu de votre compte, ou revenez{" "}
            <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              au tableau de bord
            </Link>
            .
          </p>
        )}
      </div>

      <Dialog open={adding} onOpenChange={(open) => !open && setAdding(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un organisateur</DialogTitle>
            <DialogDescription>
              Il ou elle reçoit un email et accède à l&apos;espace en se connectant avec cette adresse (mot de passe, Google ou Discord).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-email">E-mail</Label>
              <Input
                id="team-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-name">
                Nom <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="team-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} disabled={isSaving} />
            </div>
            {formError && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Ajout…" : "Ajouter et prévenir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!toRemove}
        onOpenChange={(open) => {
          if (!open) {
            setToRemove(null);
            setRemoveError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toRemove?.isMe ? "Quitter l'équipe ?" : `Retirer ${toRemove?.name || toRemove?.email} ?`}</DialogTitle>
            <DialogDescription>
              {toRemove?.isMe
                ? "Vous n'aurez plus accès à cet espace. Un organisateur pourra vous ajouter à nouveau."
                : "Cette personne n'aura plus accès à l'espace. Ses commentaires restent. Aucun email n'est envoyé."}
            </DialogDescription>
          </DialogHeader>
          {removeError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {removeError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={remove}>
              {toRemove?.isMe ? "Quitter l'équipe" : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
