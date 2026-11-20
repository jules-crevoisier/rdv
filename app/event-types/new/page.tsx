"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvailabilityForm } from "@/components/availability-form";
import type { TimeSlot } from "@/lib/types";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { ColorSwatches, EVENT_COLORS } from "@/components/app/color-swatches";


const statusOptions = [
  { value: "online", label: "En ligne" },
  { value: "private", label: "Privé" },
  { value: "archived", label: "Archivé" },
  { value: "closed", label: "Fermé" },
];

export default function NewEventTypePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    color: EVENT_COLORS[0].value,
    bufferTime: 0,
    status: "online" as "online" | "private" | "archived" | "closed",
    requiresApproval: false,
    location: "",
    meetingType: "in-person" as "in-person" | "video",
  });
  const [dateAvailabilities, setDateAvailabilities] = useState<Array<{ date: string; available: boolean; timeSlots: TimeSlot[] }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name || !formData.description) {
      setFormError("Donnez un nom et une description à ce type de rendez-vous.");
      return;
    }

    if (!session?.user?.id) {
      setFormError("Votre session a expiré. Reconnectez-vous puis réessayez.");
      return;
    }

    // Vérifier qu'au moins une date avec disponibilité est définie
    const hasAvailabilities = dateAvailabilities.some((a) => a.available && a.timeSlots.length > 0);
    if (!hasAvailabilities) {
      setFormError("Ajoutez au moins un jour avec une plage horaire, sinon personne ne pourra réserver.");
      return;
    }

    setIsSubmitting(true);

    try {

      const response = await fetch("/api/event-types", {
        method: "POST",
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
          dateOverrides: dateAvailabilities,
        }),
      });


      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la création" }));
        console.error("[NewEventTypePage] Erreur:", error);
        setFormError(error.error || "L\'enregistrement n\'a pas abouti.");
        setIsSubmitting(false);
        return;
      }

      await response.json();
      router.push("/event-types");
    } catch (error) {
      setFormError("L'enregistrement n'a pas abouti. Vérifiez votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <Link href="/event-types" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Types de rendez-vous
          </Link>
          <PageHeader
            title="Nouveau type de rendez-vous"
            description="Donnez-lui un nom, une durée et des horaires : le lien de réservation est prêt dès l'enregistrement."
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
                  placeholder="Consultation de 30 minutes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ce que le client doit savoir avant de réserver"
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
                        const newValue = Math.max(15, formData.duration - 5);
                        setFormData({ ...formData, duration: newValue });
                      }}
                      disabled={formData.duration <= 15}
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
                        const newValue = Math.min(120, formData.duration + 5);
                        setFormData({ ...formData, duration: newValue });
                      }}
                      disabled={formData.duration >= 120}
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
                        const newValue = Math.max(0, formData.bufferTime - 5);
                        setFormData({ ...formData, bufferTime: newValue });
                      }}
                      disabled={formData.bufferTime <= 0}
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
                        const newValue = Math.min(60, formData.bufferTime + 5);
                        setFormData({ ...formData, bufferTime: newValue });
                      }}
                      disabled={formData.bufferTime >= 60}
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
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
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
                  value={formData.meetingType}
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
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={formData.meetingType === "video" ? "Ex: https://meet.google.com/xxx-yyyy-zzz (optionnel)" : "Ex: 123 Rue de la Paix, Paris"}
                />
                {formData.meetingType === "video" && (
                  <p className="text-xs text-muted-foreground">
                    {formData.location && (formData.location.startsWith("http://") || formData.location.startsWith("https://"))
                      ? "Le lien personnalisé sera utilisé pour tous les rendez-vous"
                      : "Un lien Jitsi Meet sera généré automatiquement pour chaque rendez-vous. Vous pouvez aussi saisir un lien Google Meet personnalisé ci-dessus."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <AvailabilityForm dateOverrides={dateAvailabilities} onChange={setDateAvailabilities} />

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
              {isSubmitting ? "Création…" : "Créer le type"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
