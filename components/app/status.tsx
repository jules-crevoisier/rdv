import { cn } from "@/lib/utils";

export const APPOINTMENT_STATUS: Record<string, { label: string; className: string; dot: string }> = {
  pending: { label: "En attente", className: "bg-warning/12 text-warning", dot: "bg-warning" },
  confirmed: { label: "Confirmé", className: "bg-success/12 text-success", dot: "bg-success" },
  cancelled: { label: "Annulé", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  completed: { label: "Terminé", className: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
};

export const StatusPill = ({ status, className }: { status: string; className?: string }) => {
  const s = APPOINTMENT_STATUS[status] ?? { label: status, className: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" };
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium", s.className, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
};
