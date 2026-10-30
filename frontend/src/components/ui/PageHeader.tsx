import { cn } from "@/lib/utils";

/** Encabezado común de las pantallas: título grande, subtítulo y acciones a la derecha. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-base text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
