"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock } from "lucide-react";
import type { TimeSlot } from "@/lib/types";
import { getDayName } from "@/lib/utils";

const daysOfWeek = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

type AvailabilityFormProps = {
  timeSlots: Record<number, TimeSlot[]>;
  onChange: (timeSlots: Record<number, TimeSlot[]>) => void;
};

export const AvailabilityForm = ({ timeSlots, onChange }: AvailabilityFormProps) => {
  const handleAddTimeSlot = (day: number) => {
    const newSlot: TimeSlot = {
      day,
      startTime: "09:00",
      endTime: "17:00",
    };
    onChange({
      ...timeSlots,
      [day]: [...(timeSlots[day] || []), newSlot],
    });
  };

  const handleRemoveTimeSlot = (day: number, index: number) => {
    onChange({
      ...timeSlots,
      [day]: timeSlots[day].filter((_, i) => i !== index),
    });
  };

  const handleUpdateTimeSlot = (day: number, index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...timeSlots[day]];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...timeSlots,
      [day]: updated,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilités</CardTitle>
        <CardDescription>
          Définissez les heures auxquelles vous êtes disponible pour ce type de rendez-vous. Vous pouvez
          ajouter plusieurs plages par jour (ex: 9h-12h et 14h-17h).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysOfWeek.map((day) => {
          const slots = timeSlots[day.value] || [];
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
                  type="button"
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
                        type="button"
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
  );
};
