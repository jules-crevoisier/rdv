"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, addMinutes } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "react-day-picker/locale";
import type { BookingFormData } from "@/lib/types";
import { Clock, Calendar as CalendarIcon, User, Mail, Phone, FileText, XCircle, Archive } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  description: string;
  duration: number;
  bufferTime: number;
  requiresApproval: boolean;
  status: string;
};

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const eventTypeId = params.id as string;
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const response = await fetch(`/api/event-types/public/${eventTypeId}`);
        if (!response.ok) {
          // Si le type n'existe pas, on garde eventType à null pour afficher un message
          setEventType(null);
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        setEventType(data);
      } catch (error) {
        setEventType(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventType();
  }, [eventTypeId]);

  // Récupérer toutes les dates avec créneaux disponibles
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (eventType) {
        try {
          const response = await fetch(`/api/availability/${eventTypeId}/dates`);
          if (response.ok) {
            const data = await response.json();
            setAvailableDates(data.dates || []);
          }
        } catch (error) {
          console.error("Error fetching available dates:", error);
        }
      }
    };

    fetchAvailableDates();
  }, [eventType, eventTypeId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (eventType && selectedDate) {
        try {
          // Formater la date en YYYY-MM-DD en utilisant le fuseau horaire local
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
          const day = String(selectedDate.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          
          const response = await fetch(`/api/availability/${eventTypeId}?date=${dateStr}`);
          if (response.ok) {
            const data = await response.json();
            setAvailableSlots(data.slots);
            setSelectedTimeSlot(null);
          }
        } catch (error) {
          console.error("Error fetching slots:", error);
        }
      }
    };

    fetchSlots();
  }, [eventType, selectedDate, eventTypeId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeSlot || !eventType || !formData.name || !formData.email) {
      alert("Veuillez remplir tous les champs obligatoires et sélectionner un créneau");
      return;
    }

    setIsSubmitting(true);

    try {
      const startTime = new Date(selectedTimeSlot);
      const endTime = addMinutes(startTime, eventType.duration);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la réservation" }));
        alert(errorData.error || "Erreur lors de la réservation");
        setIsSubmitting(false);
        return;
      }

      const appointment = await response.json();
      if (!appointment || !appointment.id) {
        alert("Erreur : le rendez-vous n'a pas pu être créé");
        setIsSubmitting(false);
        return;
      }

      router.push(`/book/${eventTypeId}/confirmation?appointmentId=${appointment.id}`);
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Une erreur est survenue lors de la création du rendez-vous");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  // Si le type n'existe pas
  if (!eventType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <h1 className="mb-2 text-2xl font-bold">Type de rendez-vous introuvable</h1>
              <p className="text-muted-foreground mb-4">
                Le type de rendez-vous que vous recherchez n'existe pas ou a été supprimé.
              </p>
              <Button variant="outline" onClick={() => router.push("/")}>
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si le statut ne permet pas l'accès
  if (eventType.status !== "online" && eventType.status !== "private") {
    const getStatusMessage = () => {
      switch (eventType.status) {
        case "archived":
          return {
            icon: <Archive className="h-16 w-16 text-muted-foreground mb-4" />,
            title: "Type de rendez-vous archivé",
            message: "Ce type de rendez-vous a été archivé et n'est plus disponible pour les réservations.",
            description: "Les réservations pour ce type de rendez-vous ne sont plus acceptées. Veuillez contacter l'organisateur pour plus d'informations.",
          };
        case "closed":
          return {
            icon: <XCircle className="h-16 w-16 text-destructive mb-4" />,
            title: "Réservations fermées",
            message: "Ce type de rendez-vous est actuellement fermé et n'accepte plus de nouvelles réservations.",
            description: "Les réservations sont temporairement suspendues. Veuillez réessayer plus tard ou contacter l'organisateur.",
          };
        default:
          return {
            icon: <XCircle className="h-16 w-16 text-muted-foreground mb-4" />,
            title: "Formulaire indisponible",
            message: "Le formulaire de réservation est actuellement indisponible.",
            description: "Veuillez réessayer plus tard ou contacter l'organisateur pour plus d'informations.",
          };
      }
    };

    const statusInfo = getStatusMessage();

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              {statusInfo.icon}
              <h1 className="mb-2 text-2xl font-bold">{statusInfo.title}</h1>
              <p className="text-muted-foreground mb-2 font-medium">{statusInfo.message}</p>
              <p className="text-sm text-muted-foreground mb-6">{statusInfo.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">{eventType.name}</p>
                <p className="text-xs text-muted-foreground">{eventType.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = format(date, "yyyy-MM-dd");
    // Désactiver les dates passées et les dates sans créneaux disponibles
    return date < today || !availableDates.includes(dateStr);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold">{eventType.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{eventType.description}</p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Sélectionnez une date
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Choisissez le jour de votre rendez-vous</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={disabledDates}
                    locale={fr}
                    weekStartsOn={1}
                    modifiers={{
                      hasSlots: availableDates.map((dateStr) => {
                        const [year, month, day] = dateStr.split("-").map(Number);
                        const date = new Date(year, month - 1, day);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      }),
                    }}
                    className="rounded-md border w-full"
                  />
                </div>
                {selectedDate && (
                  <div className="mt-4">
                    <p className="text-xs sm:text-sm font-medium">
                      Créneaux disponibles le {formatDate(selectedDate)}
                    </p>
                    {availableSlots.length === 0 ? (
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        Aucun créneau disponible pour cette date
                      </p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableSlots.map((slot) => {
                          const slotDate = new Date(slot);
                          const isSelected = selectedTimeSlot === slot;
                          return (
                            <Button
                              key={slot}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTimeSlot(slot)}
                              className="text-xs"
                            >
                              {formatTime(slotDate)}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Vos informations
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Remplissez vos coordonnées pour finaliser la réservation</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Votre nom"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informations supplémentaires..."
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  {selectedTimeSlot && (
                    <div className="rounded-lg border bg-muted p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm font-medium">Résumé</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDate(selectedTimeSlot)} à {formatTime(selectedTimeSlot)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Durée: {eventType.duration} minutes
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          {eventType.duration} min
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={!selectedTimeSlot || isSubmitting}>
                    {isSubmitting ? "Réservation en cours..." : "Confirmer la réservation"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 sm:mt-8">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Détails du rendez-vous</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                <Link href="/client/login" className="text-primary hover:underline">
                  Connectez-vous
                </Link>
                {" ou "}
                <Link href="/client/register" className="text-primary hover:underline">
                  créez un compte
                </Link>
                {" pour voir tous vos rendez-vous"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Durée</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{eventType.duration} minutes</p>
                  </div>
                </div>
                {eventType.bufferTime > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Temps de pause</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{eventType.bufferTime} minutes</p>
                    </div>
                  </div>
                )}
                {eventType.requiresApproval && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Approbation</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Requis</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
