import { CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export const EmptyState = ({ title, description, action, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center", className)}>
    <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
      <CalendarX2 className="size-5" />
    </span>
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);
