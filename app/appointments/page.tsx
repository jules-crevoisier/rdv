"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAppointments, deleteAppointment, saveAppointment } from "@/lib/storage";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { Calendar, User, Mail, Phone, FileText, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    setAppointments(getAppointments());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      deleteAppointment(id);
      setAppointments(getAppointments());
    }
  };

  const handleStatusChange = (id: string, status: Appointment["status"]) => {
    const appointment = appointments.find((a) => a.id === id);
    if (appointment) {
      const updated: Appointment = {
        ...appointment,
        status,
        updatedAt: new Date().toISOString(),
      };
      saveAppointment(updated);
      setAppointments(getAppointments());
    }
  };

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

  const allAppointments = appointments.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const upcomingAppointments = appointments
    .filter((a) => new Date(a.startTime) > new Date() && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const pastAppointments = appointments
    .filter((a) => new Date(a.startTime) < new Date() || a.status === "cancelled")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const pendingAppointments = appointments
    .filter((a) => a.status === "pending")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {appointment.clientName}
            </CardTitle>
            <CardDescription className="mt-1">{appointment.eventTypeName}</CardDescription>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateTime(appointment.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.clientEmail}</span>
          </div>
          {appointment.clientPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.clientPhone}</span>
            </div>
          )}
          {appointment.notes && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{appointment.notes}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" onClick={() => setSelectedAppointment(appointment)}>
                  Détails
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Détails du rendez-vous</DialogTitle>
                  <DialogDescription>Informations complètes sur le rendez-vous</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p className="text-lg font-semibold">{appointment.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{appointment.clientEmail}</p>
                  </div>
                  {appointment.clientPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                      <p>{appointment.clientPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type de rendez-vous</p>
                    <p>{appointment.eventTypeName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                    <p>{formatDateTime(appointment.startTime)}</p>
                    <p className="text-sm text-muted-foreground">
                      Durée: {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                  </div>
                  {appointment.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{appointment.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {appointment.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleStatusChange(appointment.id, "confirmed")}
                  title="Confirmer"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                  title="Annuler"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(appointment.id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">Gérez tous vos rendez-vous</p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tous ({allAppointments.length})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({pendingAppointments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">À venir ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="past">Passés ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Aucun rendez-vous</h3>
                  <p className="text-center text-muted-foreground">
                    Les rendez-vous réservés apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Aucun rendez-vous en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Aucun rendez-vous à venir</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Aucun rendez-vous passé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
