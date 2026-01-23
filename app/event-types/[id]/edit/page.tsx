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

const colors = [
  { name: "Bleu", value: "#3b82f6" },
  { name: "Vert", value: "#10b981" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Rose", value: "#ec4899" },
];

type EventTypeFromDB = {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  bufferTime: number;
  status: string;
  requiresApproval: boolean;
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

  useEffect(() => {
    const fetchEventType = async () => {
      console.log("[EditEventTypePage] Chargement du type:", id);
      if (!session?.user) {
        console.log("[EditEventTypePage] Pas de session");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/event-types/${id}`);
        console.log("[EditEventTypePage] Réponse status:", response.status);
        
        if (!response.ok) {
          console.error("[EditEventTypePage] Erreur:", response.status);
          router.push("/event-types");
          return;
        }

        const data = await response.json();
        console.log("[EditEventTypePage] Type chargé:", data);
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
    if (!formData || !formData.name || !formData.description) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[EditEventTypePage] Envoi des modifications:", formData);
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
        }),
      });

      console.log("[EditEventTypePage] Réponse status:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        alert(error.error || "Erreur lors de la mise à jour");
        setIsSubmitting(false);
        return;
      }

      console.log("[EditEventTypePage] Type mis à jour avec succès");
      router.push("/event-types");
    } catch (error) {
      console.error("[EditEventTypePage] Erreur:", error);
      alert("Une erreur est survenue");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/event-types">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Modifier le type de rendez-vous</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Modifiez les détails de votre type de rendez-vous</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Informations de base</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Définissez les détails de votre type de rendez-vous</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Consultation initiale"
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce type de rendez-vous"
                  rows={4}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm">Durée (minutes) *</Label>
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
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      readOnly
                      className="text-center text-sm sm:text-base"
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm">Couleur</Label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="bufferTime"
                      type="number"
                      value={formData.bufferTime}
                      readOnly
                      className="text-center text-sm sm:text-base"
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
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="private">Privé</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
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
                <Label htmlFor="requiresApproval" className="cursor-pointer text-sm">
                  Nécessite une approbation manuelle
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
            <Link href="/event-types" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
