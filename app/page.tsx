"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Users, Calendar as CalendarIcon } from "lucide-react";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de vos rendez-vous</p>
          </div>
          <Link href="/event-types/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau type de rendez-vous
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Types de rendez-vous</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventTypes.length}</div>
              <p className="text-xs text-muted-foreground">Types configurés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendez-vous aujourd'hui</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">Rendez-vous prévus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total rendez-vous</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">Tous les rendez-vous</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
              <CardDescription>Sélectionnez une date pour voir les rendez-vous</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
              {selectedDateAppointments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Rendez-vous le {formatDate(selectedDate)}</p>
                  {selectedDateAppointments.map((apt) => {
                    const userIsClient = isClient(apt);
                    return (
                      <div key={apt.id} className="flex items-center justify-between rounded-lg border p-2">
                        <div>
                          {userIsClient ? (
                            <>
                              <p className="font-medium">Votre rendez-vous</p>
                              <p className="text-xs text-muted-foreground">{apt.eventType.name}</p>
                            </>
                          ) : (
                            <p className="font-medium">{apt.clientName}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                          </p>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    );
                  })}
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
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => {
                    const userIsOwner = isOwner(apt);
                    const userIsClient = isClient(apt);
                    return (
                      <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex-1">
                          {userIsClient ? (
                            <>
                              <p className="font-medium">Vous avez un rendez-vous</p>
                              <p className="text-sm text-muted-foreground">{apt.eventType.name}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">{apt.clientName}</p>
                              <p className="text-sm text-muted-foreground">{apt.eventType.name}</p>
                            </>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatDate(apt.startTime)} à {formatTime(apt.startTime)}
                          </p>
                          {userIsClient && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Rendez-vous pris
                            </Badge>
                          )}
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
