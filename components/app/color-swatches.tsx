import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const EVENT_COLORS = [
  { name: "Bleu", value: "#3b82f6" },
  { name: "Vert", value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Rose", value: "#ec4899" },
  { name: "Ardoise", value: "#475569" },
];

/* Choix de couleur en un clic, au lieu d'une liste déroulante. */
export const ColorSwatches = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const options = EVENT_COLORS.some((c) => c.value === value) ? EVENT_COLORS : [...EVENT_COLORS, { name: "Actuelle", value }];
  return (
    <div role="radiogroup" aria-label="Couleur" className="flex flex-wrap gap-2">
      {options.map((c) => {
        const selected = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={c.name}
            title={c.name}
            onClick={() => onChange(c.value)}
            className={cn(
              "grid size-10 place-items-center rounded-full outline-none transition-transform duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-95",
              selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-105"
            )}
          >
            <span className="grid size-7 place-items-center rounded-full" style={{ backgroundColor: c.value }}>
              {selected && <Check className="size-4 text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
