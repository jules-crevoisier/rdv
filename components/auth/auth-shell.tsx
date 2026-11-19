import { Brand } from "@/components/app/brand";

/* Exemple de journée affichée à côté des formulaires de connexion : le produit tel qu'il est. */
const SAMPLE = [
  { time: "09:00", end: "09:30", who: "Camille R.", what: "Premier rendez-vous", state: "Confirmé" },
  { time: "10:15", end: "11:00", who: "Hugo M.", what: "Séance de suivi", state: "Confirmé" },
  { time: "14:30", end: "15:00", who: "Inès B.", what: "Appel découverte", state: "En attente" },
];

const SampleTicket = ({ t, i }: { t: (typeof SAMPLE)[number]; i: number }) => (
  <div className="ticket-shadow enter" style={{ animationDelay: `${200 + i * 110}ms` }}>
    <div className="ticket" style={{ background: "#17181a" }}>
      <div className="ticket__stub text-[#eef0f3]">
        <span className="text-[1.0625rem] leading-none">{t.time}</span>
        <span className="text-[0.6875rem] text-[#8e8f92]">{t.end}</span>
      </div>
      <div className="ticket__body flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#eef0f3]">{t.who}</p>
          <p className="truncate text-xs text-[#8e8f92]">{t.what}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
            t.state === "Confirmé" ? "bg-[#3cc495]/15 text-[#3cc495]" : "bg-[#f0a24a]/15 text-[#f0a24a]"
          }`}
        >
          {t.state}
        </span>
      </div>
    </div>
  </div>
);

type AuthShellProps = {
  children: React.ReactNode;
  /** h1 de la page, au-dessus du formulaire */
  title: string;
  description?: string;
  /** Titre du panneau de gauche */
  headline?: string;
  lead?: string;
};

export const AuthShell = ({
  children,
  title,
  description,
  headline = "Vos rendez-vous se prennent tout seuls.",
  lead = "Partagez un lien, vos clients choisissent un créneau libre, vous confirmez d'un clic.",
}: AuthShellProps) => (
  <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
    <div className="flex flex-col px-5 py-6 sm:px-10 sm:py-8">
      <Brand />
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm space-y-8 enter">
          <div className="space-y-2">
            <h1 className="text-[2.25rem] leading-[1.05]">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {/* Les formulaires existants gardent leur Card : on l'aplatit ici, sans toucher à leur logique */}
          <div className="[&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:hidden [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-none">
            {children}
          </div>
        </div>
      </div>
    </div>

    <aside
      className="relative hidden overflow-hidden bg-[#0b0c0e] p-10 text-[#eef0f3] lg:flex lg:flex-col lg:justify-between xl:p-14"
      aria-label="Aperçu de Reservy"
    >
      <div className="max-w-md space-y-4">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#8e8f92]">Reservy</p>
        <p className="font-display text-[2.75rem] leading-[1.02] tracking-[-0.04em] text-balance">{headline}</p>
        <p className="text-[#8e8f92]">{lead}</p>
      </div>

      <div className="max-w-md space-y-3">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#8e8f92]">Mardi, 3 rendez-vous</p>
        {SAMPLE.map((t, i) => (
          <SampleTicket key={t.time} t={t} i={i} />
        ))}
      </div>

      <span className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#1f2de6] opacity-80 blur-[90px]" aria-hidden="true" />
    </aside>
  </div>
);
