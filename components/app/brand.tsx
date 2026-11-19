import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const BrandMark = ({ className }: { className?: string }) => (
  <span className={cn("grid size-7 place-items-center rounded-md bg-primary text-primary-foreground", className)} aria-hidden="true">
    <CalendarCheck className="size-4" />
  </span>
);

export const Brand = ({ href = "/", className }: { href?: string; className?: string }) => (
  <Link
    href={href}
    className={cn("inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
  >
    <BrandMark />
    Reservy
  </Link>
);
