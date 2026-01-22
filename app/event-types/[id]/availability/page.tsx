"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getEventTypes, getAvailabilityByEventType, saveAvailability } from "@/lib/storage";
import { generateId, getDayName } from "@/lib/utils";
import type { EventType, Availability, TimeSlot } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const daysOfWeek = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

export default function AvailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<number, TimeSlot[]>>({});

  useEffect(() => {
    const eventTypes = getEventTypes();
    const found = eventTypes.find((et) => et.id === id);
    if (found) {
      setEventType(found);
      const avail = getAvailabilityByEventType(id);
      if (avail) {
        setAvailability(avail);
        // Organiser les créneaux par jour
        const slotsByDay: Record<number, TimeSlot[]> = {};
        daysOfWeek.forEach((day) => {
          slotsByDay[day.value] = avail.timeSlots.filter((slot) => slot.day === day.value);
        });
        setTimeSlotsByDay(slotsByDay);
      } else {
        // Créer une disponibilité vide
        const newAvail: Availability = {
          id: generateId(),
          eventTypeId: id,
          timeSlots: [],
          dateOverrides: [],
        };
        setAvailability(newAvail);
        const slotsByDay: Record<number, TimeSlot[]> = {};
        daysOfWeek.forEach((day) => {
          slotsByDay[day.value] = [];
        });
        setTimeSlotsByDay(slotsByDay);
      }
    } else {
      router.push("/event-types");
    }
  }, [id, router]);

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

  const handleSave = () => {
    if (!availability || !eventType) return;

    // Rassembler tous les créneaux
    const allTimeSlots: TimeSlot[] = [];
    Object.values(timeSlotsByDay).forEach((slots) => {
      allTimeSlots.push(...slots);
    });

    const updatedAvailability: Availability = {
      ...availability,
      timeSlots: allTimeSlots,
    };

    saveAvailability(updatedAvailability);
    router.push("/event-types");
  };

  if (!eventType || !availability) {
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
          <Button onClick={handleSave}>Enregistrer les disponibilités</Button>
        </div>
      </div>
    </MainLayout>
  );
}
