"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Archive, CalendarClock, ChevronDown, Check, ExternalLink, Globe, Lock, MoreHorizontal, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { CopyButton } from "@/components/app/copy-button";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<EventTypeFromDB | null>(null);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  useEffect(() => {
    const fetchEventTypes = async () => {
      
      if (sessionStatus === "loading") {
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
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
        setEventTypes(eventTypesData);

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
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

    try {
      const response = await fetch(`/api/event-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la suppression" }));
        setActionError(errorData.error || "La suppression n'a pas abouti.");
        return;
      }

      // Recharger la liste
      setToDelete(null);
      const refreshResponse = await fetch("/api/event-types");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("[EventTypesPage] Erreur lors de la suppression:", error);
      setActionError("La suppression n'a pas abouti.");
    }
  };

  const getBookingLink = (id: string) => `${origin}/book/${id}`;


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



  const formatTimeSlots = (timeSlotsString: string | undefined): string => {
    if (!timeSlotsString) return "";
    
    try {
      const timeSlots: TimeSlot[] = JSON.parse(timeSlotsString);
      if (timeSlots.length === 0) return "";

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
          const ranges = slots.map((s) => `${s.startTime}–${s.endTime}`).join(", ");
          return `${daysOfWeek[day]} ${ranges}`;
        });

      return formattedDays.join("  ·  ");
    } catch (error) {
      return "";
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
      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        setActionError(errorData.error || "Le statut n'a pas pu être changé.");
        return;
      }

      // Recharger la liste
      const refreshResponse = await fetch("/api/event-types");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("[EventTypesPage] Erreur lors du changement de statut:", error);
      setActionError("Le statut n'a pas pu être changé.");
    }
  };

  const STATUS = {
    online: { label: "En ligne", hint: "Visible et réservable par lien", icon: Globe, className: "bg-success/12 text-success" },
    private: { label: "Privé", hint: "Réservable seulement avec le lien", icon: Lock, className: "bg-accent text-accent-foreground" },
    archived: { label: "Archivé", hint: "Masqué, lien désactivé", icon: Archive, className: "bg-secondary text-muted-foreground" },
    closed: { label: "Fermé", hint: "Lien actif, réservations suspendues", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  } as const;

  if (isLoading) {
    return (
      <MainLayout>
        <PageSkeleton rows={3} />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <EmptyState title="Impossible de charger vos types de rendez-vous" description={error} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`${eventTypes.length} type${eventTypes.length > 1 ? "s" : ""}`}
          title="Types de rendez-vous"
          description="Chaque type a son lien de réservation, sa durée et ses horaires."
          actions={
            <Button asChild>
              <Link href="/event-types/new">
                <Plus />
                Nouveau type
              </Link>
            </Button>
          }
        />

        {actionError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {eventTypes.length === 0 ? (
          <EmptyState
            title="Créez votre premier type de rendez-vous"
            description="Une consultation de 30 minutes, un appel découverte, une séance : donnez-lui un nom, une durée et vos horaires, puis partagez le lien."
            action={
              <Button asChild>
                <Link href="/event-types/new">
                  <Plus />
                  Créer un type
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 enter-2">
            {eventTypes.map((eventType) => {
              const status = STATUS[eventType.status as keyof typeof STATUS] ?? STATUS.archived;
              const StatusIcon = status.icon;
              const hours = formatTimeSlots(eventType.availability?.timeSlots);
              const upcomingDates = getUpcomingAppointmentDates(eventType.id);
              const linkOn = isLinkAccessible(eventType.status);
              return (
                <li key={eventType.id} className="relative flex flex-col overflow-hidden rounded-2xl border bg-card">
                  <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: eventType.color }} aria-hidden="true" />
                  <div className="flex flex-1 flex-col gap-4 p-5 pl-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-xl leading-tight">
                          <Link href={`/event-types/${eventType.id}/edit`} className="outline-none hover:underline underline-offset-4 decoration-1 focus-visible:underline">
                            {eventType.name}
                          </Link>
                        </h2>
                        <p className="mt-1 font-mono text-xs text-muted-foreground tnum">
                          {eventType.duration} min
                          {eventType.bufferTime > 0 && ` · ${eventType.bufferTime} min de pause`}
                          {eventType.requiresApproval && " · à valider"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", status.className)}
                            aria-label={`Statut : ${status.label}. Changer le statut`}
                          >
                            <StatusIcon className="size-3.5" />
                            {status.label}
                            <ChevronDown className="size-3.5 opacity-70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((key) => {
                            const s = STATUS[key];
                            const Icon = s.icon;
                            return (
                              <DropdownMenuItem key={key} onClick={() => handleStatusChange(eventType.id, key)} className="items-start">
                                <Icon className="mt-0.5" />
                                <span className="flex-1">
                                  <span className="block font-medium">{s.label}</span>
                                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                                </span>
                                {eventType.status === key && <Check className="mt-0.5 text-primary" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {eventType.description && <p className="line-clamp-2 text-sm text-muted-foreground">{eventType.description}</p>}

                    <div className="space-y-1.5 text-sm">
                      <p className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        {hours ? <span className="font-mono text-xs leading-5 tnum">{hours}</span> : <span className="text-muted-foreground">Aucun horaire défini</span>}
                      </p>
                      {upcomingDates.length > 0 && (
                        <p className="pl-6 text-xs text-muted-foreground">Prochains : {upcomingDates.join(", ")}</p>
                      )}
                    </div>

                    {/* Lien de réservation, copiable en un clic */}
                    <div className={cn("mt-auto flex items-center gap-2 rounded-xl bg-secondary p-1.5 pl-3", !linkOn && "opacity-60")}>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                        {linkOn ? getBookingLink(eventType.id).replace(/^https?:\/\//, "") : "Lien désactivé (statut " + status.label.toLowerCase() + ")"}
                      </span>
                      {linkOn && (
                        <>
                          <CopyButton value={getBookingLink(eventType.id)} size="icon-sm" variant="ghost" label="Copier le lien de réservation" />
                          <Button asChild variant="ghost" size="icon-sm" aria-label="Ouvrir la page de réservation">
                            <a href={getBookingLink(eventType.id)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink />
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t px-5 py-3 pl-6">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/event-types/${eventType.id}/edit`}>
                        <Pencil />
                        Modifier
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/event-types/${eventType.id}/availability`}>
                        <CalendarClock />
                        Horaires
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Plus d'actions pour ${eventType.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {linkOn && (
                          <>
                            <DropdownMenuItem asChild>
                              <a href={getBookingLink(eventType.id)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink />
                                Voir comme un client
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(eventType)}>
                          <Trash2 />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer « {toDelete?.name} » ?</DialogTitle>
            <DialogDescription>
              Le lien de réservation cesse de fonctionner et les rendez-vous de ce type sont supprimés avec lui. Pour simplement le masquer, archivez-le.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => toDelete && handleStatusChange(toDelete.id, "archived").then(() => setToDelete(null))}>
              Archiver plutôt
            </Button>
            <Button variant="destructive" onClick={() => toDelete && handleDelete(toDelete.id)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
