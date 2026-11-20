"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { ColorSwatches } from "@/components/app/color-swatches";


type EventTypeFromDB = {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  bufferTime: number;
  status: string;
  requiresApproval: boolean;
  location?: string | null;
  meetingType?: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditEventTypePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [formData, setFormData] = useState<EventTypeFromDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventType = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/event-types/${id}`);
        
        if (!response.ok) {
          console.error("[EditEventTypePage] Erreur:", response.status);
          router.push("/event-types");
          return;
        }

        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("[EditEventTypePage] Erreur lors du chargement:", error);
        router.push("/event-types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventType();
  }, [id, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData || !formData.name || !formData.description) {
      setFormError("Donnez un nom et une description à ce type de rendez-vous.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/event-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration: formData.duration,
          color: formData.color,
          bufferTime: formData.bufferTime,
          status: formData.status,
          requiresApproval: formData.requiresApproval,
          location: formData.location || null,
          meetingType: formData.meetingType || "in-person",
        }),
      });


      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        setFormError(error.error || "L\'enregistrement n\'a pas abouti.");
        setIsSubmitting(false);
        return;
      }

      router.push("/event-types");
    } catch (error) {
      console.error("[EditEventTypePage] Erreur:", error);
      setFormError("L'enregistrement n'a pas abouti. Vérifiez votre connexion.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <MainLayout>
        <PageSkeleton rows={3} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <Link href="/event-types" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Types de rendez-vous
          </Link>
          <PageHeader
            title={formData.name || "Modifier le type"}
            description="Les changements s'appliquent aux prochaines réservations, pas à celles déjà prises."
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>L&apos;essentiel</CardTitle>
              <CardDescription>Ce que voit le client sur la page de réservation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Consultation initiale"
                  required
                 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce type de rendez-vous"
                  rows={4}
                  required
                 
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!formData) return;
                        const newValue = Math.max(15, formData.duration - 5);
                        setFormData({ ...formData, duration: newValue });
                      }}
                      disabled={!formData || formData.duration <= 15}
                    >
                      <Minus />
                    </Button>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      readOnly
                      className="text-center tnum"
                      min="15"
                      step="5"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!formData) return;
                        const newValue = Math.min(120, formData.duration + 5);
                        setFormData({ ...formData, duration: newValue });
                      }}
                      disabled={!formData || formData.duration >= 120}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur dans l&apos;agenda</Label>
                  <ColorSwatches value={formData.color} onChange={(value) => setFormData({ ...formData, color: value })} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bufferTime">Temps de pause (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!formData) return;
                        const newValue = Math.max(0, formData.bufferTime - 5);
                        setFormData({ ...formData, bufferTime: newValue });
                      }}
                      disabled={!formData || formData.bufferTime <= 0}
                    >
                      <Minus />
                    </Button>
                    <Input
                      id="bufferTime"
                      type="number"
                      value={formData.bufferTime}
                      readOnly
                      className="text-center tnum"
                      min="0"
                      step="5"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!formData) return;
                        const newValue = Math.min(60, formData.bufferTime + 5);
                        setFormData({ ...formData, bufferTime: newValue });
                      }}
                      disabled={!formData || formData.bufferTime >= 60}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "online" | "private" | "archived" | "closed") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="private">Privé</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border p-4">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--primary)]"
                />
                <Label htmlFor="requiresApproval" className="block cursor-pointer space-y-0.5">
                  <span className="block">Valider chaque demande moi-même</span>
                  <span className="block font-normal text-muted-foreground">Le créneau reste en attente jusqu&apos;à votre confirmation.</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingType">Format</Label>
                <Select
                  value={formData.meetingType || "in-person"}
                  onValueChange={(value: "in-person" | "video") => setFormData({ ...formData, meetingType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">En présentiel</SelectItem>
                    <SelectItem value="video">En visioconférence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={(formData.meetingType || "in-person") === "video" ? "Ex: https://meet.google.com/xxx-yyyy-zzz (optionnel)" : "Ex: 123 Rue de la Paix, Paris"}
                 
                />
                {(formData.meetingType || "in-person") === "video" && (
                  <p className="text-xs text-muted-foreground">
                    {(formData.location || "").startsWith("http://") || (formData.location || "").startsWith("https://")
                      ? "Le lien personnalisé sera utilisé pour tous les rendez-vous"
                      : "Un lien Jitsi Meet sera généré automatiquement pour chaque rendez-vous. Vous pouvez aussi saisir un lien Google Meet personnalisé ci-dessus."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 lg:bottom-0">
            <Button asChild type="button" variant="outline" className="flex-1 sm:flex-none">
              <Link href="/event-types">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
