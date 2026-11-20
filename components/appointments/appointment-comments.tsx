"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { staffInitials } from "@/components/staff/staff-picker";

type Comment = { id: string; authorName: string; body: string; createdAt: string; mine: boolean; canDelete: boolean };

const when = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? `aujourd'hui, ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/**
 * Fil de commentaires internes d'un rendez-vous (pôle visé, impressions…).
 * Visible par l'organisateur et les responsables placés dessus, jamais par le candidat.
 */
export const AppointmentComments = ({ appointmentId, onCountChange }: { appointmentId: string; onCountChange?: (n: number) => void }) => {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/appointments/${appointmentId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Comment[]) => active && setComments(list))
      .catch(() => active && setComments([]));
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const apply = (list: Comment[]) => {
    setComments(list);
    onCountChange?.(list.length);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Le commentaire n'a pas été enregistré.");
        return;
      }
      apply(data);
      setDraft("");
    } catch {
      setError("Le commentaire n'a pas été enregistré.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/appointments/${appointmentId}/comments?commentId=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) apply(await res.json());
  };

  return (
    <div className="space-y-4">
      {comments === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Chargement des commentaires
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas encore de commentaire. Notez par exemple le pôle visé ou vos impressions.</p>
      ) : (
        <ol className="space-y-3" aria-label="Commentaires">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-medium" aria-hidden="true">
                {staffInitials(c.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="truncate font-medium text-foreground">{c.mine ? "Vous" : c.authorName}</span>
                  <span className="shrink-0">{when(c.createdAt)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm">{c.body}</p>
              </div>
              {c.canDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  onClick={() => remove(c.id)}
                  aria-label="Supprimer ce commentaire"
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={send} className="space-y-2">
        <label htmlFor={`comment-${appointmentId}`} className="sr-only">
          Ajouter un commentaire
        </label>
        <Textarea
          id={`comment-${appointmentId}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
          }}
          placeholder="Ex. : vise le pôle logistique, dispo le week-end"
          maxLength={2000}
          className="min-h-16"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Visible par l&apos;organisateur et les responsables, pas par le candidat.</p>
          <Button type="submit" size="sm" disabled={sending || !draft.trim()} className="shrink-0">
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            Publier
          </Button>
        </div>
      </form>
    </div>
  );
};
