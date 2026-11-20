"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";

type Client = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  _count: {
    appointments: number;
  };
};

export default function ClientsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Note: Cette page permet aux administrateurs de créer et gérer des comptes clients
  // Les clients peuvent ensuite se connecter pour voir leurs rendez-vous

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    fetchClients();
  }, [session, sessionStatus]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des clients");
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          phone: formData.phone || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la création" }));
        setError(errorData.error || "Erreur lors de la création du client");
        return;
      }

      // Réinitialiser le formulaire et fermer le dialog
      setFormData({ email: "", password: "", name: "", phone: "" });
      setIsDialogOpen(false);
      setError("");
      
      // Rafraîchir la liste
      fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      setError("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleteError(null);
    try {
      const response = await fetch(`/api/clients/${toDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        setDeleteError("La suppression n'a pas abouti.");
        return;
      }
      setToDelete(null);
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      setDeleteError("La suppression n'a pas abouti.");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageSkeleton rows={5} />
      </MainLayout>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? clients.filter((c) => [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)))
    : clients;

  const initials = (c: Client) =>
    (c.name || c.email).split(/[\s@.]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`${clients.length} compte${clients.length > 1 ? "s" : ""} client`}
          title="Clients"
          description="Créez un compte pour un client : il retrouve ses rendez-vous et réserve plus vite."
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus />
                  Ajouter un client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un client</DialogTitle>
                  <DialogDescription>Le client se connecte avec cet e-mail et ce mot de passe provisoire.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom et prénom</Label>
                    <Input id="name" autoComplete="off" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" autoComplete="off" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={isSubmitting} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe provisoire</Label>
                      <Input id="password" type="password" autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} disabled={isSubmitting} />
                      <p className="text-xs text-muted-foreground">6 caractères minimum.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span>
                      </Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={isSubmitting} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Création…" : "Créer le compte"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        {clients.length === 0 ? (
          <EmptyState
            title="Aucun client pour l'instant"
            description="Les personnes qui réservent sans compte restent dans vos réservations. Ajoutez ici celles qui reviennent souvent."
          />
        ) : (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un nom, un e-mail…"
                aria-label="Rechercher un client"
                className="pl-10"
              />
            </div>

            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {filtered.map((client) => (
                <li key={client.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium" aria-hidden="true">
                    {initials(client)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{client.name || client.email}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                      <a href={`mailto:${client.email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </a>
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                          <Phone className="size-3.5" />
                          {client.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium tnum">{client._count.appointments}</p>
                    <p className="text-xs text-muted-foreground">rendez-vous</p>
                  </div>
                  <p className="hidden w-28 text-right text-xs text-muted-foreground lg:block">
                    depuis {new Date(client.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                  </p>
                  <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(client)} aria-label={`Supprimer ${client.name || client.email}`}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">Aucun client ne correspond à « {query} ».</li>}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte de {toDelete?.name || toDelete?.email} ?</DialogTitle>
            <DialogDescription>Le client ne pourra plus se connecter. Ses rendez-vous restent dans votre agenda.</DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Garder
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
