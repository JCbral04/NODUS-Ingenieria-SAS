import { cn } from "@/lib/utils";

/** Tarjeta del paso actual del caso: título centrado y, debajo, lo que toca hacer. */
export function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section aria-label={`Paso actual: ${title}`} className="card mx-auto mt-8 max-w-[860px] overflow-hidden text-center">
      <header className="px-6 pb-3 pt-7">
        <p className="text-sm text-ink">Paso actual</p>
        <h2 className="mt-0.5 text-3xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mx-auto mt-1.5 max-w-xl text-base text-ink">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

/** Franja de contenido dentro de la tarjeta, separada por una línea. */
export function StepBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-t border-line px-6 py-6 sm:px-10", className)}>{children}</div>;
}

export function StepError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mx-auto mt-4 max-w-md rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-left text-sm text-ink"
    >
      {children}
    </p>
  );
}
