import { cn } from "@/lib/utils";

/* Squelettes de chargement : la forme de la page, sans texte « Chargement... ». */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-secondary", className)} aria-hidden="true" />
);

export const PageSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-8" role="status" aria-label="Chargement">
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-72 max-w-full" />
    </div>
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  </div>
);

export const FullScreenLoader = () => (
  <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Chargement">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-pulse rounded-full bg-primary"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);
