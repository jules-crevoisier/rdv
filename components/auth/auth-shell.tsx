import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Cadre commun des écrans de compte (mot de passe oublié, confirmation d'email...). */
export const AuthShell = ({ title, description, children, footer }: AuthShellProps) => (
  <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
    <div className="w-full max-w-md space-y-6">
      <Link
        href="/"
        className="mx-auto flex w-fit items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarCheck className="size-4" aria-hidden />
        </span>
        Reservy
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
          {description ? <CardDescription className="leading-relaxed">{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  </main>
);
