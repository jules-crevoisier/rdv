"use client";

import Link from "next/link";
import { Plus, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type StaffMember = { id: string; name: string; email: string; role: string | null };

export const staffInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* Pastilles des responsables présents + menu pour en cocher ou décocher. */
export const StaffPicker = ({
  staff,
  value,
  onChange,
  disabled,
  label,
  emptyLabel = "Aucun responsable",
  onAddSelf,
}: {
  staff: StaffMember[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  label: string;
  emptyLabel?: string;
  /** Affiche « Me placer sur cet entretien » (l'organisateur se met lui-même en responsable). */
  onAddSelf?: () => void;
}) => {
  const selected = staff.filter((s) => value.includes(s.id));
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {selected.length === 0 ? (
        <span className="text-sm text-muted-foreground">{emptyLabel}</span>
      ) : (
        selected.map((s) => (
          <span
            key={s.id}
            title={s.email}
            className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border bg-background pl-1 pr-2.5 text-xs font-medium"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem]" aria-hidden="true">
              {staffInitials(s.name)}
            </span>
            <span className="truncate">{s.name}</span>
            {s.role && <span className="hidden truncate font-normal text-muted-foreground sm:inline">{s.role}</span>}
          </span>
        ))
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" disabled={disabled} aria-label={label}>
            <UserRoundPlus />
            <span className={cn(selected.length > 0 && "sr-only")}>Choisir</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {onAddSelf && (
            <>
              <DropdownMenuItem onClick={onAddSelf}>
                <UserRoundCheck />
                Me placer sur cet entretien
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Responsables présents</DropdownMenuLabel>
          {staff.map((s) => (
            <DropdownMenuCheckboxItem
              key={s.id}
              checked={value.includes(s.id)}
              onCheckedChange={(on) => toggle(s.id, on === true)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="min-w-0">
                <span className="block truncate">{s.name}</span>
                {s.role && <span className="block truncate text-xs text-muted-foreground">{s.role}</span>}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/staff">
              <Plus />
              Ajouter un responsable
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
