import { cn } from "@/lib/utils";

const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const day = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

type TicketProps = {
  start: string | Date;
  end?: string | Date;
  /** Affiche la date au-dessus de l'heure (listes multi-jours) */
  showDate?: boolean;
  /** Couleur du type de rendez-vous (petite pastille) */
  color?: string;
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "li" | "article";
};

/* Ligne de rendez-vous : l'heure à gauche, le détail à droite. */
export const Ticket = ({ start, end, showDate, color, muted, className, children, as: Tag = "div" }: TicketProps) => {
  const s = new Date(start);
  const e = end ? new Date(end) : null;

  return (
    <Tag className={cn("flex gap-4 rounded-xl border bg-card p-4", muted && "opacity-60", className)}>
      <div className="w-16 shrink-0 text-sm">
        {showDate && <p className="text-xs text-muted-foreground first-letter:uppercase">{day(s)}</p>}
        <p className="flex items-center gap-1.5 font-medium tnum">
          {color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
          {time(s)}
        </p>
        {e && <p className="text-xs text-muted-foreground tnum">{time(e)}</p>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </Tag>
  );
};
