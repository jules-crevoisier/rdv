import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({ eyebrow, title, description, actions, className }: PageHeaderProps) => (
  <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between enter", className)}>
    <div className="min-w-0 space-y-2">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-[2rem] leading-[1.05] sm:text-[2.5rem]">{title}</h1>
      {description && <p className="max-w-xl text-[0.9375rem] text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
  </header>
);
