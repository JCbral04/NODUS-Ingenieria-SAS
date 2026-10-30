import { cn } from "@/lib/utils";

/**
 * Encabezado de cada pantalla: franja con el mismo degradado del login (negro → verde),
 * de borde a borde. Título grande, subtítulo y acciones a la derecha, todo en blanco.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Línea pequeña sobre el título (por ejemplo, un enlace para volver). */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Sale del padding de <main> hasta los bordes de la ventana.
        "relative -mt-4 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] bg-gradient-to-br from-sidebar via-sidebar to-primary text-white lg:-mt-8",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-4 px-4 py-7 lg:px-8 lg:py-9">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 text-sm font-medium text-white/90">{eyebrow}</div>}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{title}</h1>
          {description && <p className="mt-1.5 text-base text-white/90">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3 text-white">{actions}</div>}
      </div>
    </div>
  );
}
