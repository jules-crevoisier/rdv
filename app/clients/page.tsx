"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, User, Trash2, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Erreur lors de la suppression");
        return;
      }

      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Une erreur est survenue");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Vous devez être connecté pour accéder à cette page</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des clients</h1>
            <p className="text-muted-foreground">Créez et gérez les comptes clients</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau client</DialogTitle>
                <DialogDescription>
                  Créez un compte client. Un mot de passe temporaire sera défini.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe temporaire *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le client pourra changer ce mot de passe après sa première connexion
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du client"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Création..." : "Créer le client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
            <CardDescription>
              {clients.length} client{clients.length > 1 ? "s" : ""} au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Aucun client enregistré</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Créez votre premier client pour commencer
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rendez-vous</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {client.name || "Sans nom"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{client._count.appointments}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(client.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
