"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { TimeSlot } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import Link from "next/link";

const daysOfWeek = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
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
  availability?: {
    id: string;
    eventTypeId: string;
    timeSlots: string;
    dateOverrides: string;
  };
};

export default function AvailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [eventType, setEventType] = useState<EventTypeFromDB | null>(null);
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<number, TimeSlot[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("[AvailabilityPage] Chargement pour eventTypeId:", id);
      if (!session?.user) {
        console.log("[AvailabilityPage] Pas de session");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/event-types/${id}`);
        console.log("[AvailabilityPage] Réponse status:", response.status);
        
        if (!response.ok) {
          console.error("[AvailabilityPage] Erreur:", response.status);
          router.push("/event-types");
          return;
        }

        const data = await response.json();
        console.log("[AvailabilityPage] Type chargé:", data);
        setEventType(data);

        // Organiser les créneaux par jour
        const slotsByDay: Record<number, TimeSlot[]> = {};
        daysOfWeek.forEach((day) => {
          slotsByDay[day.value] = [];
        });

        if (data.availability?.timeSlots) {
          try {
            const timeSlots: TimeSlot[] = JSON.parse(data.availability.timeSlots);
            console.log("[AvailabilityPage] TimeSlots parsés:", timeSlots);
            timeSlots.forEach((slot) => {
              if (slotsByDay[slot.day]) {
                slotsByDay[slot.day].push(slot);
              }
            });
          } catch (error) {
            console.error("[AvailabilityPage] Erreur lors du parsing des timeSlots:", error);
          }
        }

        setTimeSlotsByDay(slotsByDay);
      } catch (error) {
        console.error("[AvailabilityPage] Erreur lors du chargement:", error);
        router.push("/event-types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, session, router]);

  const handleAddTimeSlot = (day: number) => {
    const newSlot: TimeSlot = {
      day,
      startTime: "09:00",
      endTime: "17:00",
    };
    setTimeSlotsByDay({
      ...timeSlotsByDay,
      [day]: [...(timeSlotsByDay[day] || []), newSlot],
    });
  };

  const handleRemoveTimeSlot = (day: number, index: number) => {
    setTimeSlotsByDay({
      ...timeSlotsByDay,
      [day]: timeSlotsByDay[day].filter((_, i) => i !== index),
    });
  };

  const handleUpdateTimeSlot = (day: number, index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...timeSlotsByDay[day]];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlotsByDay({
      ...timeSlotsByDay,
      [day]: updated,
    });
  };

  const handleSave = async () => {
    if (!eventType) return;

    setIsSaving(true);

    try {
      // Rassembler tous les créneaux
      const allTimeSlots: TimeSlot[] = [];
      Object.values(timeSlotsByDay).forEach((slots) => {
        allTimeSlots.push(...slots);
      });

      console.log("[AvailabilityPage] Envoi des disponibilités:", {
        eventTypeId: id,
        timeSlots: allTimeSlots,
      });

      const response = await fetch(`/api/availability/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlots: allTimeSlots,
          dateOverrides: [],
        }),
      });

      console.log("[AvailabilityPage] Réponse status:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la sauvegarde" }));
        alert(error.error || "Erreur lors de la sauvegarde");
        setIsSaving(false);
        return;
      }

      console.log("[AvailabilityPage] Disponibilités sauvegardées avec succès");
      router.push("/event-types");
    } catch (error) {
      console.error("[AvailabilityPage] Erreur:", error);
      alert("Une erreur est survenue");
      setIsSaving(false);
    }
  };

  if (isLoading || !eventType) {
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
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/event-types">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gérer les disponibilités</h1>
            <p className="text-muted-foreground">
              Configurez les plages horaires pour {eventType.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plages horaires par jour</CardTitle>
            <CardDescription>
              Définissez les heures auxquelles vous êtes disponible pour ce type de rendez-vous. Vous pouvez
              ajouter plusieurs plages par jour (ex: 9h-12h et 14h-17h).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {daysOfWeek.map((day) => {
              const slots = timeSlotsByDay[day.value] || [];
              return (
                <div key={day.value} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{day.label}</h3>
                      {slots.length > 0 && (
                        <Badge variant="secondary">{slots.length} plage{slots.length > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeSlot(day.value)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une plage
                    </Button>
                  </div>

                  {slots.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Aucune plage horaire définie pour ce jour
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                      {slots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex flex-1 items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">De</Label>
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    handleUpdateTimeSlot(day.value, index, "startTime", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </div>
                              <span className="pt-6 text-muted-foreground">à</span>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">À</Label>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    handleUpdateTimeSlot(day.value, index, "endTime", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTimeSlot(day.value, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {day.value < 6 && <Separator className="my-4" />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/event-types">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer les disponibilités"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
