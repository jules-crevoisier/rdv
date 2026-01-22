"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { Calendar, User, Mail, Phone, FileText, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AppointmentFromDB = {
  id: string;
  userId: string;
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

export default function AppointmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentFromDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (sessionStatus === "loading") {
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/appointments");
        if (!response.ok) {
          console.error("Error fetching appointments:", response.status);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [session, sessionStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la suppression" }));
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      // Recharger la liste
      const refreshResponse = await fetch("/api/appointments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Une erreur est survenue lors de la suppression");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        alert(errorData.error || "Erreur lors de la mise à jour");
        return;
      }

      // Recharger la liste
      const refreshResponse = await fetch("/api/appointments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Une erreur est survenue lors de la mise à jour");
    }
  };

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

  const renderAppointmentCard = (appointment: AppointmentFromDB) => (
    <Card key={appointment.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {appointment.clientName}
            </CardTitle>
            <CardDescription className="mt-1">{appointment.eventType.name}</CardDescription>
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
                    <p>{appointment.eventType.name}</p>
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
