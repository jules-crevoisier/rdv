import Link from "next/link";
import { cn } from "@/lib/utils";

/* Marque : un petit billet (talon + perforation) et le mot Reservy. */
export const BrandMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 28 20" aria-hidden="true" className={cn("h-5 w-7", className)}>
    <path
      d="M4 1h20a3 3 0 0 1 3 3v3.2a2.8 2.8 0 0 0 0 5.6V16a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-3.2a2.8 2.8 0 0 0 0-5.6V4a3 3 0 0 1 3-3Z"
      fill="currentColor"
    />
    <path d="M10 4.5v11" stroke="var(--background)" strokeWidth="1.4" strokeDasharray="1.6 1.8" />
  </svg>
);

export const Brand = ({ href = "/", className }: { href?: string; className?: string }) => (
  <Link
    href={href}
    className={cn("inline-flex items-center gap-2.5 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 rounded-md", className)}
  >
    <BrandMark className="text-primary" />
    <span className="font-display text-[1.25rem] leading-none tracking-[-0.03em]">Reservy</span>
  </Link>
);
