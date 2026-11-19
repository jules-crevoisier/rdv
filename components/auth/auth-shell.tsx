import { Brand } from "@/components/app/brand";

type AuthShellProps = {
  children: React.ReactNode;
  /** h1 de la page, au-dessus du formulaire */
  title: string;
  description?: string;
  /** Conservés pour compatibilité, plus affichés */
  headline?: string;
  lead?: string;
};

/* Page de connexion simple et centrée, façon shadcn/ui. */
export const AuthShell = ({ children, title, description }: AuthShellProps) => (
  <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
    <Brand className="mb-6" />
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm enter sm:p-8">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {/* Les formulaires existants gardent leur Card : on l'aplatit ici, sans toucher à leur logique */}
      <div className="[&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:hidden [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-none">
        {children}
      </div>
    </div>
  </div>
);
