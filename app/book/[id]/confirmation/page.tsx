"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAppointments } from "@/lib/storage";
import { formatDateTime } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { CheckCircle, Calendar, User, Mail, Phone } from "lucide-react";
import Link from "next/link";

const ConfirmationContent = () => {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (appointmentId) {
      const appointments = getAppointments();
      const found = appointments.find((a) => a.id === appointmentId);
      if (found) {
        setAppointment(found);
      }
    }
  }, [appointmentId]);

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Réservation confirmée !</CardTitle>
              <CardDescription>
                {appointment.status === "pending"
                  ? "Votre demande de rendez-vous a été envoyée et est en attente d'approbation."
                  : "Votre rendez-vous a été confirmé avec succès."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                    <p className="text-lg font-semibold">{formatDateTime(appointment.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type de rendez-vous</p>
                    <p className="text-lg font-semibold">{appointment.eventTypeName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom</p>
                    <p className="text-lg font-semibold">{appointment.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold">{appointment.clientEmail}</p>
                  </div>
                </div>

                {appointment.clientPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                      <p className="text-lg font-semibold">{appointment.clientPhone}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge
                    variant={appointment.status === "pending" ? "outline" : "default"}
                    className="mt-1"
                  >
                    {appointment.status === "pending" ? "En attente d'approbation" : "Confirmé"}
                  </Badge>
                </div>
              </div>

              {appointment.status === "pending" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    Votre demande de rendez-vous est en attente d'approbation. Vous recevrez une
                    confirmation par email une fois qu'elle sera approuvée.
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4 pt-4">
                <Link href="/">
                  <Button variant="outline">Retour à l'accueil</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
