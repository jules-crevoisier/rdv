"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffMember } from "@/components/staff/staff-picker";

type Assigned = { id: string; name: string }[];

/**
 * Annuaire des responsables de l'organisateur + actions pour placer des responsables sur un rendez-vous.
 * `onUpdated` reçoit la nouvelle équipe du rendez-vous pour mettre la liste à jour sans rechargement.
 */
export const useAppointmentStaff = (enabled: boolean, onUpdated: (appointmentId: string, staff: Assigned) => void) => {
  const [directory, setDirectory] = useState<StaffMember[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/staff")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: StaffMember[]) => active && setDirectory(list))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [enabled]);

  const named = useCallback(
    (ids: string[], extra: StaffMember[] = []) => {
      const all = [...directory, ...extra];
      return ids
        .map((id) => all.find((s) => s.id === id))
        .filter((s): s is StaffMember => Boolean(s))
        .map((s) => ({ id: s.id, name: s.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    },
    [directory]
  );

  const assign = useCallback(
    async (appointmentId: string, staffIds: string[], previous: Assigned) => {
      setBusyId(appointmentId);
      setError(null);
      onUpdated(appointmentId, named(staffIds));
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/staff`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffIds }),
        });
        if (!res.ok) throw new Error();
      } catch {
        onUpdated(appointmentId, previous);
        setError("Les responsables n'ont pas été enregistrés. Réessayez.");
      } finally {
        setBusyId(null);
      }
    },
    [named, onUpdated]
  );

  const addSelf = useCallback(
    async (appointmentId: string) => {
      setBusyId(appointmentId);
      setError(null);
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/staff`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error();
        const member = data.member as StaffMember;
        setDirectory((d) => (d.some((s) => s.id === member.id) ? d : [...d, member]));
        onUpdated(appointmentId, named(data.staffIds, [member]));
      } catch {
        setError("Impossible de vous placer sur cet entretien. Réessayez.");
      } finally {
        setBusyId(null);
      }
    },
    [named, onUpdated]
  );

  return { directory, busyId, error, assign, addSelf };
};
