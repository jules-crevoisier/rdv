import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/* État vide : un billet en pointillés, vierge, à remplir. */
export const EmptyState = ({ title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-2xl border-[1.5px] border-dashed border-input px-6 py-14 text-center",
      className
    )}
  >
    <div className="grid h-12 w-[4.5rem] grid-cols-[1.25rem_1fr] overflow-hidden rounded-lg border-[1.5px] border-dashed border-input" aria-hidden="true">
      <span className="border-r-[1.5px] border-dashed border-input" />
      <span />
    </div>
    <div className="space-y-1">
      <p className="font-display text-xl tracking-[-0.02em]">{title}</p>
      {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);
