"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Edit, Trash2, ExternalLink, Calendar, Globe, Lock, Archive, XCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { EventType, TimeSlot } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  availability?: {
    timeSlots: string;
  };
};

type AppointmentFromDB = {
  id: string;
  eventTypeId: string;
  startTime: string;
  endTime: string;
  status: string;
};

export default function EventTypesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [eventTypes, setEventTypes] = useState<EventTypeFromDB[]>([]);
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventTypes = async () => {
      console.log("[EventTypesPage] Début du chargement des types de rendez-vous");
      console.log("[EventTypesPage] Statut de session:", sessionStatus);
      console.log("[EventTypesPage] Session:", session);
      
      if (sessionStatus === "loading") {
        console.log("[EventTypesPage] Session en cours de chargement, attente...");
        return;
      }

      if (!session?.user) {
        console.log("[EventTypesPage] Pas de session, redirection vers login");
        setIsLoading(false);
        return;
      }

      try {
        console.log("[EventTypesPage] Appel API /api/event-types et /api/appointments");
        const [eventTypesResponse, appointmentsResponse] = await Promise.all([
          fetch("/api/event-types"),
          fetch("/api/appointments"),
        ]);
        
        if (!eventTypesResponse.ok) {
          const errorData = await eventTypesResponse.json().catch(() => ({ error: "Erreur inconnue" }));
          console.error("[EventTypesPage] Erreur API:", errorData);
          setError(errorData.error || "Erreur lors de la récupération");
          setIsLoading(false);
          return;
        }

        const eventTypesData = await eventTypesResponse.json();
        console.log("[EventTypesPage] Types reçus:", eventTypesData.length);
        setEventTypes(eventTypesData);

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          console.log("[EventTypesPage] Rendez-vous reçus:", appointmentsData.length);
          setAppointments(appointmentsData);
        }
      } catch (error) {
        console.error("[EventTypesPage] Erreur lors du fetch:", error);
        setError("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventTypes();
  }, [session, sessionStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce type de rendez-vous ?")) {
      return;
    }

    try {
      console.log("[EventTypesPage] Suppression du type:", id);
      const response = await fetch(`/api/event-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la suppression" }));
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      console.log("[EventTypesPage] Type supprimé, rechargement de la liste");
      // Recharger la liste
      const refreshResponse = await fetch("/api/event-types");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("[EventTypesPage] Erreur lors de la suppression:", error);
      alert("Une erreur est survenue lors de la suppression");
    }
  };

  const getBookingLink = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/book/${id}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Lien copié dans le presse-papiers !");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "En ligne";
      case "private":
        return "Privé";
      case "archived":
        return "Archivé";
      case "closed":
        return "Fermé";
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "online":
        return "default";
      case "private":
        return "secondary";
      case "archived":
        return "outline";
      case "closed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Globe className="h-3 w-3" />;
      case "private":
        return <Lock className="h-3 w-3" />;
      case "archived":
        return <Archive className="h-3 w-3" />;
      case "closed":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatTimeSlots = (timeSlotsString: string | undefined): string => {
    if (!timeSlotsString) return "Aucune plage horaire";
    
    try {
      const timeSlots: TimeSlot[] = JSON.parse(timeSlotsString);
      if (timeSlots.length === 0) return "Aucune plage horaire";

      const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const slotsByDay: Record<number, TimeSlot[]> = {};
      
      timeSlots.forEach((slot) => {
        if (!slotsByDay[slot.day]) {
          slotsByDay[slot.day] = [];
        }
        slotsByDay[slot.day].push(slot);
      });

      const formattedDays = Object.keys(slotsByDay)
        .map(Number)
        .sort()
        .map((day) => {
          const slots = slotsByDay[day];
          const ranges = slots.map((s) => `${s.startTime}-${s.endTime}`).join(", ");
          return `${daysOfWeek[day]}: ${ranges}`;
        });

      return formattedDays.join(" • ");
    } catch (error) {
      return "Erreur de format";
    }
  };

  const formatDateShort = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getUpcomingAppointmentDates = (eventTypeId: string): string[] => {
    const eventAppointments = appointments
      .filter((apt) => 
        apt.eventTypeId === eventTypeId && 
        apt.status !== "cancelled" &&
        new Date(apt.startTime) >= new Date()
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3); // Limiter à 3 prochaines dates

    return eventAppointments.map((apt) => {
      const date = new Date(apt.startTime);
      return formatDateShort(date);
    });
  };

  const isLinkAccessible = (status: string) => {
    return status === "online" || status === "private";
  };

  const handleStatusChange = async (eventTypeId: string, newStatus: string) => {
    try {
      console.log("[EventTypesPage] Changement de statut:", eventTypeId, "->", newStatus);
      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        alert(errorData.error || "Erreur lors de la mise à jour du statut");
        return;
      }

      console.log("[EventTypesPage] Statut mis à jour, rechargement de la liste");
      // Recharger la liste
      const refreshResponse = await fetch("/api/event-types");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("[EventTypesPage] Erreur lors du changement de statut:", error);
      alert("Une erreur est survenue lors de la mise à jour du statut");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="mb-2 text-lg font-semibold text-destructive">Erreur</h3>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Types de rendez-vous</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gérez vos différents types de rendez-vous</p>
          </div>
          <Link href="/event-types/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau type
            </Button>
          </Link>
        </div>

        {eventTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Aucun type de rendez-vous</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Créez votre premier type de rendez-vous pour commencer à accepter des réservations
              </p>
              <Link href="/event-types/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un type de rendez-vous
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: eventType.color }}
                          />
                          {eventType.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge 
                              variant={getStatusVariant(eventType.status)} 
                              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                            >
                              {getStatusIcon(eventType.status)}
                              {getStatusLabel(eventType.status)}
                              <ChevronDown className="h-3 w-3" />
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(eventType.id, "online")}
                              className="flex items-center gap-2"
                            >
                              <Globe className="h-4 w-4" />
                              En ligne
                              {eventType.status === "online" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(eventType.id, "private")}
                              className="flex items-center gap-2"
                            >
                              <Lock className="h-4 w-4" />
                              Privé
                              {eventType.status === "private" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(eventType.id, "archived")}
                              className="flex items-center gap-2"
                            >
                              <Archive className="h-4 w-4" />
                              Archivé
                              {eventType.status === "archived" && " ✓"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(eventType.id, "closed")}
                              className="flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Fermé
                              {eventType.status === "closed" && " ✓"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="mt-2">{eventType.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Durée</span>
                      <span className="font-medium">{eventType.duration} minutes</span>
                    </div>
                    {eventType.bufferTime > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Temps de pause</span>
                        <span className="font-medium">{eventType.bufferTime} minutes</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Plages horaires</span>
                      <p className="text-xs font-medium text-foreground">
                        {formatTimeSlots(eventType.availability?.timeSlots)}
                      </p>
                    </div>
                    {(() => {
                      const upcomingDates = getUpcomingAppointmentDates(eventType.id);
                      if (upcomingDates.length > 0) {
                        return (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Prochains rendez-vous</span>
                            <div className="flex flex-wrap gap-1">
                              {upcomingDates.map((date, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {date}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {eventType.requiresApproval && (
                      <Badge variant="outline" className="w-fit">
                        Approbation requise
                      </Badge>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/event-types/${eventType.id}/edit`} className="w-full">
                          <Button variant="outline" className="w-full text-xs sm:text-sm">
                            <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Modifier</span>
                            <span className="sm:hidden">Modif.</span>
                          </Button>
                        </Link>
                        <Link href={`/event-types/${eventType.id}/availability`} className="w-full">
                          <Button variant="outline" className="w-full text-xs sm:text-sm">
                            <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Disponibilités</span>
                            <span className="sm:hidden">Dispo.</span>
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex-1 text-xs sm:text-sm"
                              disabled={!isLinkAccessible(eventType.status)}
                            >
                              <ExternalLink className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Lien</span>
                              <span className="sm:hidden">Lien</span>
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Lien de réservation</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                              {isLinkAccessible(eventType.status) 
                                ? "Partagez ce lien pour permettre aux clients de réserver ce type de rendez-vous"
                                : "Ce type de rendez-vous n'est pas accessible publiquement. Le statut doit être 'En ligne' ou 'Privé' pour partager le lien."}
                            </DialogDescription>
                          </DialogHeader>
                          {isLinkAccessible(eventType.status) ? (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={getBookingLink(eventType.id)}
                                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm"
                                />
                                <Button onClick={() => copyToClipboard(getBookingLink(eventType.id))} className="w-full sm:w-auto">
                                  Copier
                                </Button>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => window.open(getBookingLink(eventType.id), "_blank")} className="w-full sm:w-auto">
                                  Ouvrir
                                </Button>
                              </DialogFooter>
                            </>
                          ) : (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                              <p className="text-xs sm:text-sm text-destructive">
                                Le lien de réservation n'est pas disponible car le statut est "{getStatusLabel(eventType.status)}".
                                Changez le statut en "En ligne" ou "Privé" pour activer le lien.
                              </p>
                            </div>
                          )}
                        </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(eventType.id)}
                          className="px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
