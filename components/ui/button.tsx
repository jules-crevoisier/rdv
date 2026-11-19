import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Boutons : un pas de 1px vers le haut au survol (pointeur fin), un appui de 1px vers le bas
  avec scale .985. Aucune autre propriété n'est animée que la couleur et le transform.
*/
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium select-none",
    "transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease)]",
    "[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px active:translate-y-px active:scale-[.985] active:duration-75",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-0",
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_86%,var(--foreground))]",
        ink: "bg-ink text-ink-foreground hover:bg-[color-mix(in_srgb,var(--ink)_86%,var(--background))]",
        destructive:
          "bg-destructive text-white hover:bg-[color-mix(in_srgb,var(--destructive)_86%,black)]",
        outline:
          "border border-input bg-card text-foreground hover:border-[color-mix(in_srgb,var(--foreground)_30%,var(--input))] hover:bg-secondary/60",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_80%,var(--foreground))]",
        ghost: "text-foreground hover:bg-secondary",
        link: "text-primary underline-offset-4 decoration-1 hover:underline hover:translate-y-0 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 has-[>svg]:px-3.5",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-[0.9375rem] has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
