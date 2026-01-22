"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Users, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { getEventTypes, getAppointments } from "@/lib/storage";
import { formatDate, formatTime, isSameDay } from "@/lib/utils";
import type { EventType, Appointment } from "@/lib/types";

export default function DashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    setEventTypes(getEventTypes());
    setAppointments(getAppointments());
  }, []);

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, new Date());
  });

  const selectedDateAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, selectedDate);
  });

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startTime) > new Date() && apt.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants: Record<Appointment["status"], "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    };
    const labels: Record<Appointment["status"], string> = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

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
                  {selectedDateAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div>
                        <p className="font-medium">{apt.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                        </p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  ))}
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
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-medium">{apt.clientName}</p>
                        <p className="text-sm text-muted-foreground">{apt.eventTypeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(apt.startTime)} à {formatTime(apt.startTime)}
                        </p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  ))}
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
