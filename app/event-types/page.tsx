"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Edit, Trash2, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { getEventTypes, deleteEventType } from "@/lib/storage";
import type { EventType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    setEventTypes(getEventTypes());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce type de rendez-vous ?")) {
      deleteEventType(id);
      setEventTypes(getEventTypes());
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

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Types de rendez-vous</h1>
            <p className="text-muted-foreground">Gérez vos différents types de rendez-vous</p>
          </div>
          <Link href="/event-types/new">
            <Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: eventType.color }}
                        />
                        {eventType.name}
                      </CardTitle>
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
                    {eventType.requiresApproval && (
                      <Badge variant="outline" className="w-fit">
                        Approbation requise
                      </Badge>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <Link href={`/event-types/${eventType.id}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </Button>
                        </Link>
                        <Link href={`/event-types/${eventType.id}/availability`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Calendar className="mr-2 h-4 w-4" />
                            Disponibilités
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Lien
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Lien de réservation</DialogTitle>
                            <DialogDescription>
                              Partagez ce lien pour permettre aux clients de réserver ce type de rendez-vous
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={getBookingLink(eventType.id)}
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            <Button onClick={() => copyToClipboard(getBookingLink(eventType.id))}>
                              Copier
                            </Button>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => window.open(getBookingLink(eventType.id), "_blank")}>
                              Ouvrir
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(eventType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
