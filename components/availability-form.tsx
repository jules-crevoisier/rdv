"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import type { TimeSlot } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "react-day-picker/locale";

type DateAvailability = {
  date: string; // YYYY-MM-DD
  available: boolean;
  timeSlots: TimeSlot[];
};

type AvailabilityFormProps = {
  dateOverrides?: DateAvailability[];
  onChange: (dateOverrides: DateAvailability[]) => void;
};

export const AvailabilityForm = ({ dateOverrides = [], onChange }: AvailabilityFormProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Ajouter des dates depuis le calendrier
  const handleAddDates = () => {
    if (selectedDates.length === 0) return;

    const newAvailabilities: DateAvailability[] = [...dateOverrides];
    
    selectedDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingIndex = newAvailabilities.findIndex((a) => a.date === dateStr);
      
      if (existingIndex === -1) {
        // Créer une nouvelle disponibilité avec une plage horaire par défaut
        newAvailabilities.push({
          date: dateStr,
          available: true,
          timeSlots: [{ day: 0, startTime: "09:00", endTime: "17:00" }],
        });
      }
    });

    onChange(newAvailabilities);
    setSelectedDates([]);
  };

  // Supprimer une date
  const handleRemoveDate = (dateStr: string) => {
    onChange(dateOverrides.filter((a) => a.date !== dateStr));
  };

  // Mettre à jour une plage horaire
  const handleUpdateTimeSlot = (
    dateStr: string,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updated = dateOverrides.map((availability) => {
      if (availability.date === dateStr) {
        const updatedSlots = [...availability.timeSlots];
        updatedSlots[index] = { ...updatedSlots[index], [field]: value };
        return { ...availability, timeSlots: updatedSlots };
      }
      return availability;
    });
    onChange(updated);
  };

  // Ajouter une plage horaire à une date
  const handleAddTimeSlot = (dateStr: string) => {
    const updated = dateOverrides.map((availability) => {
      if (availability.date === dateStr) {
        return {
          ...availability,
          timeSlots: [
            ...availability.timeSlots,
            { day: 0, startTime: "09:00", endTime: "17:00" },
          ],
        };
      }
      return availability;
    });
    onChange(updated);
  };

  // Supprimer une plage horaire
  const handleRemoveTimeSlot = (dateStr: string, index: number) => {
    const updated = dateOverrides.map((availability) => {
      if (availability.date === dateStr) {
        return {
          ...availability,
          timeSlots: availability.timeSlots.filter((_, i) => i !== index),
        };
      }
      return availability;
    });
    onChange(updated);
  };

  // Basculer la disponibilité d'une date
  const handleToggleAvailability = (dateStr: string) => {
    const updated = dateOverrides.map((availability) => {
      if (availability.date === dateStr) {
        return { ...availability, available: !availability.available };
      }
      return availability;
    });
    onChange(updated);
  };

  // Obtenir les dates déjà configurées pour les désactiver dans le calendrier
  const configuredDates = dateOverrides.map((a) => new Date(a.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilités par date</CardTitle>
        <CardDescription>
          Sélectionnez des dates spécifiques dans le calendrier et configurez les plages horaires pour chaque date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 block">Sélectionner des dates</Label>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                locale={fr}
                weekStartsOn={1}
                className="rounded-md border"
                disabled={(date) => {
                  // Désactiver les dates passées
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddDates}
              disabled={selectedDates.length === 0}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter {selectedDates.length > 0 ? `${selectedDates.length} date${selectedDates.length > 1 ? "s" : ""}` : "des dates"}
            </Button>
            {dateOverrides.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Dates configurées ({dateOverrides.length})</p>
                <div className="flex flex-wrap gap-2">
                  {dateOverrides
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 5)
                    .map((availability) => {
                      const date = new Date(availability.date);
                      return (
                        <Badge key={availability.date} variant={availability.available ? "default" : "secondary"}>
                          {format(date, "d MMM", { locale: fr })}
                        </Badge>
                      );
                    })}
                  {dateOverrides.length > 5 && (
                    <Badge variant="outline">+{dateOverrides.length - 5} autres</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold mb-2 block">Dates configurées</Label>
            {dateOverrides.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                <CalendarIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Aucune date configurée</p>
                <p className="text-xs mt-1">Sélectionnez des dates dans le calendrier pour les configurer</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {dateOverrides
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((availability) => {
                    const date = new Date(availability.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = date < today;
                    
                    return (
                      <Card key={availability.date} className={isPast ? "opacity-60" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">
                                {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                              </CardTitle>
                              {isPast && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Passée
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={availability.available ? "default" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleAvailability(availability.date)}
                              >
                                {availability.available ? "Disponible" : "Indisponible"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveDate(availability.date)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {availability.available && (
                          <CardContent className="space-y-3">
                            {availability.timeSlots.length === 0 ? (
                              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                                Aucune plage horaire
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {availability.timeSlots.map((slot, index) => (
                                  <div key={index} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) =>
                                          handleUpdateTimeSlot(
                                            availability.date,
                                            index,
                                            "startTime",
                                            e.target.value
                                          )
                                        }
                                        className="w-24 h-8 text-xs"
                                      />
                                      <span className="text-xs text-muted-foreground">-</span>
                                      <Input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) =>
                                          handleUpdateTimeSlot(
                                            availability.date,
                                            index,
                                            "endTime",
                                            e.target.value
                                          )
                                        }
                                        className="w-24 h-8 text-xs"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleRemoveTimeSlot(availability.date, index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTimeSlot(availability.date)}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Ajouter une plage horaire
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
