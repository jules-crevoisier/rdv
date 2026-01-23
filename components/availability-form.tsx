"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Clock, Calendar as CalendarIcon, Repeat } from "lucide-react";
import type { TimeSlot } from "@/lib/types";
import { format, addDays } from "date-fns";
import { fr } from "react-day-picker/locale";

type DateAvailability = {
  date: string; // YYYY-MM-DD
  available: boolean;
  timeSlots: TimeSlot[];
  generatedByRuleId?: string; // ID de la règle qui a généré cette date
};

type RecurringRule = {
  id: string;
  daysOfWeek: number[]; // 0 = dimanche, 1 = lundi, etc.
  startTime: string;
  endTime: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

type AvailabilityFormProps = {
  dateOverrides?: DateAvailability[];
  onChange: (dateOverrides: DateAvailability[]) => void;
};

// Templates d'horaires par défaut
const DEFAULT_TIME_TEMPLATES = [
  { name: "Matin (8h-12h)", slots: [{ day: 0, startTime: "08:00", endTime: "12:00" }] },
  { name: "Après-midi (14h-16h)", slots: [{ day: 0, startTime: "14:00", endTime: "16:00" }] },
  { name: "Journée complète (8h-12h / 14h-16h)", slots: [
    { day: 0, startTime: "08:00", endTime: "12:00" },
    { day: 0, startTime: "14:00", endTime: "16:00" }
  ]},
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export const AvailabilityForm = ({ dateOverrides = [], onChange }: AvailabilityFormProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState<Omit<RecurringRule, "id">>({
    daysOfWeek: [],
    startTime: "14:00",
    endTime: "18:00",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 60), "yyyy-MM-dd"),
  });

  // Appliquer un template d'horaires aux dates sélectionnées
  const handleApplyTemplate = (template: typeof DEFAULT_TIME_TEMPLATES[0]) => {
    if (selectedDates.length === 0) {
      alert("Veuillez d'abord sélectionner des dates");
      return;
    }

    const newAvailabilities: DateAvailability[] = [...dateOverrides];
    
    selectedDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingIndex = newAvailabilities.findIndex((a) => a.date === dateStr);
      
      const slots = template.slots.map(slot => ({
        ...slot,
        day: date.getDay()
      }));

      if (existingIndex === -1) {
        newAvailabilities.push({
          date: dateStr,
          available: true,
          timeSlots: slots,
        });
      } else {
        newAvailabilities[existingIndex].timeSlots = slots;
      }
    });

    onChange(newAvailabilities);
    setSelectedDates([]);
  };

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
          timeSlots: [{ day: date.getDay(), startTime: "09:00", endTime: "17:00" }],
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

  // Générer les dates à partir des règles récurrentes
  const generateDatesFromRules = (rules: RecurringRule[]): DateAvailability[] => {
    const generatedDates: DateAvailability[] = [];
    const existingDates = new Set(dateOverrides.map((a) => a.date));

    rules.forEach((rule) => {
      const startDate = new Date(rule.startDate);
      const endDate = new Date(rule.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        
        if (rule.daysOfWeek.includes(dayOfWeek)) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          
          // Ne pas écraser les dates déjà configurées manuellement
          if (!existingDates.has(dateStr)) {
            const existingIndex = generatedDates.findIndex((d) => d.date === dateStr);
            const timeSlot: TimeSlot = {
              day: dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
            };

            if (existingIndex === -1) {
              generatedDates.push({
                date: dateStr,
                available: true,
                timeSlots: [timeSlot],
                generatedByRuleId: rule.id,
              });
            } else {
              // Ajouter le créneau horaire si la date existe déjà
              generatedDates[existingIndex].timeSlots.push(timeSlot);
              // Marquer comme générée par cette règle si pas déjà marquée
              if (!generatedDates[existingIndex].generatedByRuleId) {
                generatedDates[existingIndex].generatedByRuleId = rule.id;
              }
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return generatedDates;
  };

  // Appliquer les règles récurrentes
  const handleApplyRecurringRules = () => {
    // D'abord, supprimer toutes les dates précédemment générées par les règles existantes
    const manualDates = dateOverrides.filter((d) => !d.generatedByRuleId);
    const currentRuleIds = new Set(recurringRules.map((r) => r.id));
    
    // Garder uniquement les dates manuelles et celles générées par des règles encore actives
    const cleanedDates = manualDates.concat(
      dateOverrides.filter((d) => d.generatedByRuleId && currentRuleIds.has(d.generatedByRuleId))
    );

    // Générer les nouvelles dates à partir des règles
    const generatedDates = generateDatesFromRules(recurringRules);
    const mergedDates = [...cleanedDates];

    generatedDates.forEach((genDate) => {
      const existingIndex = mergedDates.findIndex((d) => d.date === genDate.date);
      if (existingIndex === -1) {
        mergedDates.push(genDate);
      } else {
        // Si la date existe déjà et a été générée par la même règle, remplacer
        if (mergedDates[existingIndex].generatedByRuleId === genDate.generatedByRuleId) {
          mergedDates[existingIndex] = genDate;
        } else {
          // Sinon, fusionner les créneaux horaires
          const existingSlots = mergedDates[existingIndex].timeSlots;
          genDate.timeSlots.forEach((slot) => {
            const slotExists = existingSlots.some(
              (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
            );
            if (!slotExists) {
              existingSlots.push(slot);
            }
          });
          // Si c'est une date manuelle, ne pas changer le generatedByRuleId
          if (!mergedDates[existingIndex].generatedByRuleId) {
            // Date manuelle, on ne la modifie pas
          } else {
            // Date générée, on peut la mettre à jour
            mergedDates[existingIndex].generatedByRuleId = genDate.generatedByRuleId;
          }
        }
      }
    });

    onChange(mergedDates);
  };

  // Ajouter une nouvelle règle
  const handleAddRule = () => {
    if (newRule.daysOfWeek.length === 0) {
      alert("Veuillez sélectionner au moins un jour de la semaine");
      return;
    }

    if (newRule.startTime >= newRule.endTime) {
      alert("L'heure de fin doit être après l'heure de début");
      return;
    }

    if (newRule.startDate >= newRule.endDate) {
      alert("La date de fin doit être après la date de début");
      return;
    }

    const rule: RecurringRule = {
      id: Date.now().toString(),
      ...newRule,
    };

    setRecurringRules([...recurringRules, rule]);
    setNewRule({
      daysOfWeek: [],
      startTime: "14:00",
      endTime: "18:00",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addDays(new Date(), 60), "yyyy-MM-dd"),
    });
    setShowRuleForm(false);
  };

  // Supprimer une règle et toutes les dates générées par cette règle
  const handleRemoveRule = (ruleId: string) => {
    if (!confirm("Voulez-vous supprimer cette règle et toutes les dates qu'elle a générées ?")) {
      return;
    }
    
    // Supprimer la règle
    setRecurringRules(recurringRules.filter((r) => r.id !== ruleId));
    
    // Supprimer toutes les dates générées par cette règle
    const updatedDates = dateOverrides.filter((date) => date.generatedByRuleId !== ruleId);
    onChange(updatedDates);
  };

  // Toggle un jour de la semaine
  const handleToggleDay = (day: number) => {
    setNewRule({
      ...newRule,
      daysOfWeek: newRule.daysOfWeek.includes(day)
        ? newRule.daysOfWeek.filter((d) => d !== day)
        : [...newRule.daysOfWeek, day],
    });
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
        <div className="space-y-4">
          {/* Règles de disponibilité automatiques */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Règles de disponibilité automatiques</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRuleForm(!showRuleForm)}
              >
                <Repeat className="mr-2 h-4 w-4" />
                {showRuleForm ? "Masquer" : "Nouvelle règle"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Créez des règles pour générer automatiquement des disponibilités récurrentes (ex: tous les lundis et mercredis de 14h à 18h)
            </p>

            {showRuleForm && (
              <div className="space-y-3 p-3 bg-background rounded-md border mb-3">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Jours de la semaine</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={newRule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleDay(day.value)}
                        className="text-xs"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Heure de début</Label>
                    <Input
                      type="time"
                      value={newRule.startTime}
                      onChange={(e) => setNewRule({ ...newRule, startTime: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Heure de fin</Label>
                    <Input
                      type="time"
                      value={newRule.endTime}
                      onChange={(e) => setNewRule({ ...newRule, endTime: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Date de début</Label>
                    <Input
                      type="date"
                      value={newRule.startDate}
                      onChange={(e) => setNewRule({ ...newRule, startDate: e.target.value })}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Date de fin</Label>
                    <Input
                      type="date"
                      value={newRule.endDate}
                      onChange={(e) => setNewRule({ ...newRule, endDate: e.target.value })}
                      min={newRule.startDate}
                      className="text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddRule}
                  className="w-full"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Ajouter la règle
                </Button>
              </div>
            )}

            {recurringRules.length > 0 && (
              <div className="space-y-2 mb-3">
                {recurringRules.map((rule) => {
                  const days = rule.daysOfWeek
                    .sort()
                    .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                    .join(", ");
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 bg-background rounded-md border text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{days}</span>
                        <span className="text-muted-foreground ml-2">
                          {rule.startTime} - {rule.endTime}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          du {format(new Date(rule.startDate), "d MMM", { locale: fr })} au{" "}
                          {format(new Date(rule.endDate), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleApplyRecurringRules}
                  className="w-full"
                >
                  <Repeat className="mr-2 h-3 w-3" />
                  Générer les dates ({generateDatesFromRules(recurringRules).length} dates)
                </Button>
              </div>
            )}
          </div>

          {/* Templates d'horaires réutilisables - toujours visibles */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <Label className="text-sm font-semibold mb-3 block">Templates d'horaires réutilisables</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Sélectionnez des dates puis cliquez sur un template pour appliquer automatiquement les horaires
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {DEFAULT_TIME_TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedDates.length === 0) {
                      alert("Veuillez d'abord sélectionner des dates dans le calendrier");
                      return;
                    }
                    handleApplyTemplate(template);
                  }}
                  className="w-full justify-start"
                  disabled={selectedDates.length === 0}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </div>
            {selectedDates.length > 0 && (
              <p className="text-xs text-primary mt-2">
                {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} sélectionnée{selectedDates.length > 1 ? "s" : ""} - Cliquez sur un template pour appliquer
              </p>
            )}
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
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
                  <p className="text-sm font-medium mb-2">Aperçu ({dateOverrides.length})</p>
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
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAvailability(availability.date)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                      availability.available ? "bg-primary" : "bg-muted"
                                    }`}
                                    role="switch"
                                    aria-checked={availability.available}
                                    aria-label={availability.available ? "Disponible" : "Indisponible"}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        availability.available ? "translate-x-6" : "translate-x-1"
                                      }`}
                                    />
                                  </button>
                                  <span className="text-xs text-muted-foreground min-w-[80px]">
                                    {availability.available ? "Disponible" : "Indisponible"}
                                  </span>
                                </div>
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
        </div>
      </CardContent>
    </Card>
  );
};
