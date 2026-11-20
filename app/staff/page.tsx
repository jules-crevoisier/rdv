"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { staffInitials, type StaffMember } from "@/components/staff/staff-picker";

type Staff = StaffMember & { upcomingCount: number };
type FormState = { name: string; email: string; role: string };
const emptyForm: FormState = { name: "", email: "", role: "" };

export default function StaffPage() {
  const { data: session, status } = useSession();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Staff | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/staff");
      if (response.ok) setStaff(await response.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) load();
  }, [session, status, load]);

  const openForm = (target: Staff | "new") => {
    setEditing(target);
    setFormError(null);
    setForm(target === "new" ? emptyForm : { name: target.name, email: target.email, role: target.role ?? "" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    setFormError(null);
    try {
      const response = await fetch(editing === "new" ? "/api/staff" : `/api/staff/${editing.id}`, {
        method: editing === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setFormError(data.error || "L'enregistrement n'a pas abouti.");
        return;
      }
      setEditing(null);
      load();
    } catch {
      setFormError("Connexion perdue. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    await fetch(`/api/staff/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    load();
  };

  if (isLoading && status !== "unauthenticated") {
    return (
      <MainLayout>
        <PageSkeleton rows={4} />
      </MainLayout>
    );
  }

  // Groupés par pôle, ceux sans pôle à la fin
  const groups = [...new Set(staff.map((s) => s.role ?? ""))]
    .sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "fr")))
    .map((role) => ({ role, members: staff.filter((s) => (s.role ?? "") === role) }));

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`${staff.length} responsable${staff.length > 1 ? "s" : ""}`}
          title="Responsables"
          description="Les personnes qui assistent aux entretiens. Placez-les ensuite sur les créneaux : elles reçoivent l'invitation à chaque réservation."
          actions={
            <Button onClick={() => openForm("new")}>
              <Plus />
              Ajouter un responsable
            </Button>
          }
        />

        {staff.length === 0 ? (
          <EmptyState
            title="Aucun responsable pour l'instant"
            description="Ajoutez les responsables de chaque pôle avec leur email. Ils n'ont pas besoin de compte."
            action={
              <Button variant="outline" onClick={() => openForm("new")}>
                <Plus />
                Ajouter le premier
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.role || "sans-pole"} className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">{group.role || "Sans pôle"}</h2>
                <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                  {group.members.map((s) => (
                    <li key={s.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium" aria-hidden="true">
                        {staffInitials(s.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.name}</p>
                        <a href={`mailto:${s.email}`} className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </a>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium tnum">{s.upcomingCount}</p>
                        <p className="text-xs text-muted-foreground">entretien{s.upcomingCount > 1 ? "s" : ""} à venir</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openForm(s)} aria-label={`Modifier ${s.name}`}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(s)} aria-label={`Retirer ${s.name}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Ajouter un responsable" : "Modifier le responsable"}</DialogTitle>
            <DialogDescription>Les invitations aux entretiens partent à cette adresse.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nom et prénom</Label>
              <Input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">E-mail</Label>
              <Input id="staff-email" type="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">
                Pôle <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="staff-role"
                list="staff-roles"
                placeholder="Communication, Logistique…"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                maxLength={60}
                disabled={isSaving}
              />
              <datalist id="staff-roles">
                {groups.filter((g) => g.role).map((g) => (
                  <option key={g.role} value={g.role} />
                ))}
              </datalist>
            </div>
            {formError && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement…" : editing === "new" ? "Ajouter" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer {toDelete?.name} ?</DialogTitle>
            <DialogDescription>
              Il ou elle disparaît de tous les créneaux et entretiens. Aucun email n&apos;est envoyé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Garder
            </Button>
            <Button variant="destructive" onClick={remove}>
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
