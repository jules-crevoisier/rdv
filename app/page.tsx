"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Users, Calendar as CalendarIcon, Download, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { formatDate, formatTime, isSameDay } from "@/lib/utils";

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

type AppointmentFromDB = {
  id: string;
  userId: string;
  clientId?: string | null;
  eventTypeId: string;
  eventType: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [eventTypes, setEventTypes] = useState<EventTypeFromDB[]>([]);
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [icalUrl, setIcalUrl] = useState<string>("");

  useEffect(() => {
    const fetchCalendarToken = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/calendar/generate-token");
          if (response.ok) {
            const data = await response.json();
            setCalendarToken(data.token);
            setIcalUrl(`${window.location.origin}/api/calendar/public/${data.token}/ical`);
          }
        } catch (error) {
          console.error("Error fetching calendar token:", error);
        }
      }
    };

    fetchCalendarToken();
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
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

        if (eventTypesResponse.ok) {
          const eventTypesData = await eventTypesResponse.json();
          setEventTypes(eventTypesData);
        }

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, sessionStatus]);

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, new Date());
  });

  const selectedDateAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, selectedDate);
  });

  // Distinguer les rendez-vous où l'utilisateur est propriétaire vs client
  const isOwner = (apt: AppointmentFromDB) => apt.userId === session?.user?.id;
  const isClient = (apt: AppointmentFromDB) => 
    apt.clientId === session?.user?.id || 
    apt.clientEmail === session?.user?.email;

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startTime) > new Date() && apt.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
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

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Vue d'ensemble de vos rendez-vous</p>
          </div>
          <div className="flex gap-2">
            {session?.user?.id && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Lien iCal</span>
                    <span className="sm:hidden">iCal</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lien de synchronisation iCal</DialogTitle>
                    <DialogDescription>
                      Copiez ce lien pour synchroniser votre calendrier avec Google Agenda, Outlook ou d'autres applications.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL du calendrier (publique)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={icalUrl}
                          className="font-mono text-xs"
                          id="ical-url-input"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(icalUrl);
                              alert("Lien copié dans le presse-papiers !");
                            } catch (err) {
                              // Fallback pour les navigateurs qui ne supportent pas clipboard API
                              const input = document.getElementById('ical-url-input') as HTMLInputElement;
                              if (input) {
                                input.select();
                                document.execCommand('copy');
                                alert("Lien copié !");
                              }
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/calendar/generate-token", {
                                method: "POST",
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setCalendarToken(data.token);
                                setIcalUrl(`${window.location.origin}/api/calendar/public/${data.token}/ical`);
                                alert("Nouveau token généré !");
                              }
                            } catch (error) {
                              alert("Erreur lors de la génération du token");
                            }
                          }}
                          title="Régénérer le token"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cette URL est publique et peut être utilisée avec Google Calendar, Outlook, etc.
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium mb-2">Instructions :</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Google Agenda : Paramètres → Ajouter un calendrier → Par URL</li>
                        <li>Outlook : Ajouter un calendrier → Abonnement Internet</li>
                        <li>Apple Calendar : Fichier → Nouvel abonnement de calendrier</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Link href="/event-types/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nouveau créneau</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Types de créneaux</p>
                <p className="text-xl sm:text-2xl font-bold">{eventTypes.length}</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Aujourd'hui</p>
                <p className="text-xl sm:text-2xl font-bold">{todayAppointments.length}</p>
              </div>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total rendez-vous</p>
                <p className="text-xl sm:text-2xl font-bold">{appointments.filter(apt => apt.status !== "cancelled").length}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Notification pour les créneaux en attente */}
        {appointments.filter((apt) => apt.status === "pending" && isOwner(apt)).length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {appointments.filter((apt) => apt.status === "pending" && isOwner(apt)).length} créneau{appointments.filter((apt) => apt.status === "pending" && isOwner(apt)).length > 1 ? "x" : ""} en attente de confirmation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Des rendez-vous nécessitent votre validation
                  </p>
                </div>
                <Link href="/appointments?tab=pending">
                  <Button variant="outline" size="sm">
                    Voir
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="w-fit max-w-xs mx-auto md:mx-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm">Calendrier</CardTitle>
            </CardHeader>
            <CardContent className="p-2 px-4 pb-4">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasAppointments: appointments
                    .filter(apt => apt.status !== "cancelled")
                    .map(apt => {
                      const date = new Date(apt.startTime);
                      date.setHours(0, 0, 0, 0);
                      return date;
                    })
                }}
              />
              {selectedDateAppointments.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium">Rendez-vous le {formatDate(selectedDate)}</p>
                  {selectedDateAppointments.map((apt) => {
                    const userIsClient = isClient(apt);
                    return (
                      <div key={apt.id} className="flex items-center justify-between rounded-lg border p-2">
                        <div className="flex-1">
                          {userIsClient ? (
                            <>
                              <p className="text-sm font-medium">Votre rendez-vous</p>
                              <p className="text-xs text-muted-foreground">{apt.eventType.name}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium">{apt.clientName}</p>
                              <p className="text-xs text-muted-foreground">{apt.eventType.name}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                          </p>
                        </div>
                        <div className="ml-2">
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 text-center py-4">
                  <p className="text-xs text-muted-foreground">Aucun rendez-vous ce jour</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prochains rendez-vous</CardTitle>
              <CardDescription>Vos rendez-vous à venir</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => {
                    const userIsOwner = isOwner(apt);
                    const userIsClient = isClient(apt);
                    return (
                      <div 
                        key={apt.id} 
                        className={`flex items-start justify-between rounded-lg border p-3 ${
                          userIsClient ? "bg-primary/5 border-primary/20" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {userIsClient ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">Vous</p>
                                {userIsClient && (
                                  <Badge variant="outline" className="text-xs">
                                    Rendez-vous pris
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{apt.eventType.name}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-sm mb-1">{apt.clientName}</p>
                              <p className="text-xs text-muted-foreground mb-1">{apt.eventType.name}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(apt.startTime)} à {formatTime(apt.startTime)}
                          </p>
                        </div>
                        <div className="ml-2 shrink-0">
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
