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

const colors = [
  { name: "Bleu", value: "#3b82f6" },
  { name: "Vert", value: "#10b981" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Rose", value: "#ec4899" },
];

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
    color: colors[0].value,
    bufferTime: 0,
    status: "online" as "online" | "private" | "archived" | "closed",
    requiresApproval: false,
  });
  const [dateAvailabilities, setDateAvailabilities] = useState<Array<{ date: string; available: boolean; timeSlots: TimeSlot[] }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!session?.user?.id) {
      alert("Vous devez être connecté");
      return;
    }

    // Vérifier qu'au moins une date avec disponibilité est définie
    const hasAvailabilities = dateAvailabilities.some((a) => a.available && a.timeSlots.length > 0);
    if (!hasAvailabilities) {
      alert("Veuillez configurer au moins une date avec des plages horaires");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[NewEventTypePage] Envoi des données:", {
        ...formData,
        dateOverrides: dateAvailabilities,
      });

      const response = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateOverrides: dateAvailabilities,
        }),
      });

      console.log("[NewEventTypePage] Réponse status:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la création" }));
        console.error("[NewEventTypePage] Erreur:", error);
        alert(error.error || "Erreur lors de la création");
        setIsSubmitting(false);
        return;
      }

      const createdEventType = await response.json();
      console.log("[NewEventTypePage] Type créé avec succès:", createdEventType);
      router.push("/event-types");
    } catch (error) {
      alert("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/event-types">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Nouveau type de rendez-vous</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Créez un nouveau type de rendez-vous</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>Définissez les détails de votre type de rendez-vous</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Consultation initiale"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce type de rendez-vous"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes) *</Label>
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
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      readOnly
                      className="text-center"
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: formData.color }}
                          />
                          {colors.find((c) => c.value === formData.color)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="bufferTime"
                      type="number"
                      value={formData.bufferTime}
                      readOnly
                      className="text-center"
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut du formulaire</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="requiresApproval" className="cursor-pointer">
                  Nécessite une approbation manuelle
                </Label>
              </div>
            </CardContent>
          </Card>

          <AvailabilityForm dateOverrides={dateAvailabilities} onChange={setDateAvailabilities} />

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
            <Link href="/event-types" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
