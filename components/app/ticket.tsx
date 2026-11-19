import { cn } from "@/lib/utils";

const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const day = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

type TicketProps = {
  start: string | Date;
  end?: string | Date;
  /** Affiche la date dans le talon (listes multi-jours) */
  showDate?: boolean;
  /** Couleur du type de rendez-vous, posée comme liseré sur le talon */
  color?: string;
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "li" | "article";
};

/*
  Le billet : le talon porte l'heure (mono, tabulaire), la perforation sépare le corps.
  Utilisé pour chaque rendez-vous dans l'app et côté client.
*/
export const Ticket = ({ start, end, showDate, color, muted, className, children, as: Tag = "div" }: TicketProps) => {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const minutes = e ? Math.round((e.getTime() - s.getTime()) / 60000) : null;

  return (
    <Tag className={cn("ticket-shadow", muted && "opacity-60", className)}>
      <div className="ticket" style={showDate ? ({ "--stub": "6.5rem" } as React.CSSProperties) : undefined}>
        <div className="ticket__stub relative">
          {color && <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: color }} aria-hidden="true" />}
          {showDate && <span className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">{day(s)}</span>}
          <span className="text-[1.0625rem] leading-none text-foreground">{time(s)}</span>
          {minutes !== null && <span className="text-[0.6875rem] text-muted-foreground">{minutes} min</span>}
        </div>
        <div className="ticket__body">{children}</div>
      </div>
    </Tag>
  );
};
