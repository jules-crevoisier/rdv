"use client";

import { Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusPill } from "@/components/app/status";
import { StaffPicker, type StaffMember } from "@/components/staff/staff-picker";
import { AppointmentComments } from "./appointment-comments";

export type PanelAppointment = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  eventTypeName: string;
  staff?: { id: string; name: string }[];
};

const range = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const t = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${s.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}, ${t(s)} – ${t(e)}`;
};

/**
 * Fiche d'un entretien : qui le fait passer et les commentaires de l'équipe.
 * Sans `directory`, la liste des responsables est en lecture seule (vue responsable).
 */
export const AppointmentPanel = ({
  appointment: a,
  open,
  onOpenChange,
  directory,
  onAssign,
  onAddSelf,
  busy,
  onCommentCount,
  team,
  error,
}: {
  appointment: PanelAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directory?: StaffMember[];
  onAssign?: (ids: string[]) => void;
  onAddSelf?: () => void;
  busy?: boolean;
  onCommentCount?: (n: number) => void;
  /** Vue responsable : les autres responsables, déjà mis en forme. */
  team?: string;
  error?: string | null;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      {a && (
        <>
          <DialogHeader className="text-left">
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <DialogTitle>{a.clientName}</DialogTitle>
              <StatusPill status={a.status} />
            </div>
            <DialogDescription className="first-letter:uppercase">
              {a.eventTypeName} · {range(a.startTime, a.endTime)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <a href={`mailto:${a.clientEmail}`} className="inline-flex min-h-6 min-w-0 items-center gap-1.5 hover:text-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{a.clientEmail}</span>
            </a>
            {a.clientPhone && (
              <a href={`tel:${a.clientPhone}`} className="inline-flex min-h-6 items-center gap-1.5 hover:text-foreground">
                <Phone className="size-3.5" aria-hidden="true" />
                {a.clientPhone}
              </a>
            )}
          </div>

          <section aria-labelledby={`team-${a.id}`} className="space-y-2 border-t pt-4">
            <h3 id={`team-${a.id}`} className="text-sm font-medium">Fait passer l&apos;entretien</h3>
            {directory && onAssign ? (
              <StaffPicker
                staff={directory}
                value={(a.staff ?? []).map((s) => s.id)}
                onChange={onAssign}
                onAddSelf={onAddSelf}
                disabled={busy}
                label={`Choisir les responsables de l'entretien de ${a.clientName}`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{team || "Vous seul·e"}</p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </section>

          <section aria-labelledby={`comments-${a.id}`} className="space-y-3 border-t pt-4">
            <h3 id={`comments-${a.id}`} className="text-sm font-medium">Commentaires de l&apos;équipe</h3>
            <AppointmentComments appointmentId={a.id} onCountChange={onCommentCount} />
          </section>
        </>
      )}
    </DialogContent>
  </Dialog>
);

