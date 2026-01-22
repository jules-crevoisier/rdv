"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { AvailabilityForm } from "@/components/availability-form";
import type { TimeSlot } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type DateAvailability = {
  date: string;
  available: boolean;
  timeSlots: TimeSlot[];
};

type EventTypeFromDB = {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  bufferTime: number;
  status: string;
  requiresApproval: boolean;
  availability?: {
    id: string;
    eventTypeId: string;
    timeSlots: string;
    dateOverrides: string;
  };
};

export default function AvailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [eventType, setEventType] = useState<EventTypeFromDB | null>(null);
  const [dateAvailabilities, setDateAvailabilities] = useState<DateAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("[AvailabilityPage] Chargement pour eventTypeId:", id);
      if (!session?.user) {
        console.log("[AvailabilityPage] Pas de session");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/event-types/${id}`);
        console.log("[AvailabilityPage] Réponse status:", response.status);
        
        if (!response.ok) {
          console.error("[AvailabilityPage] Erreur:", response.status);
          router.push("/event-types");
          return;
        }

        const data = await response.json();
        console.log("[AvailabilityPage] Type chargé:", data);
        setEventType(data);

        // Charger les disponibilités par date
        let availabilities: DateAvailability[] = [];
        if (data.availability?.dateOverrides) {
          try {
            availabilities = JSON.parse(data.availability.dateOverrides);
            console.log("[AvailabilityPage] DateAvailabilities parsés:", availabilities);
          } catch (error) {
            console.error("[AvailabilityPage] Erreur lors du parsing des dateOverrides:", error);
          }
        }

        setDateAvailabilities(availabilities);
      } catch (error) {
        console.error("[AvailabilityPage] Erreur lors du chargement:", error);
        router.push("/event-types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, session, router]);

  const handleAvailabilityChange = (availabilities: DateAvailability[]) => {
    setDateAvailabilities(availabilities);
  };

  const handleSave = async () => {
    if (!eventType) return;

    setIsSaving(true);

    try {
      console.log("[AvailabilityPage] Envoi des disponibilités:", {
        eventTypeId: id,
        dateOverrides: dateAvailabilities,
      });

      const response = await fetch(`/api/availability/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlots: [], // Plus utilisé, on utilise uniquement les dates spécifiques
          dateOverrides: dateAvailabilities,
        }),
      });

      console.log("[AvailabilityPage] Réponse status:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la sauvegarde" }));
        alert(error.error || "Erreur lors de la sauvegarde");
        setIsSaving(false);
        return;
      }

      console.log("[AvailabilityPage] Disponibilités sauvegardées avec succès");
      router.push("/event-types");
    } catch (error) {
      console.error("[AvailabilityPage] Erreur:", error);
      alert("Une erreur est survenue");
      setIsSaving(false);
    }
  };

  if (isLoading || !eventType) {
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
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/event-types">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gérer les disponibilités</h1>
            <p className="text-muted-foreground">
              Configurez les plages horaires pour {eventType.name}
            </p>
          </div>
        </div>

        <AvailabilityForm
          dateOverrides={dateAvailabilities}
          onChange={handleAvailabilityChange}
        />

        <div className="flex justify-end gap-4">
          <Link href="/event-types">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer les disponibilités"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
