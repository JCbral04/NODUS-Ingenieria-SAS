import { cn } from "@/lib/utils";

/** Bloque gris pulsante. Úsalo con las mismas dimensiones que el contenido real. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-line/70", className)} />;
}

/** Envoltorio accesible: anuncia "cargando" una sola vez a lectores de pantalla. */
export function SkeletonRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i % 2 ? "w-4/5" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="bg-sunken px-4 py-3">
        <Skeleton className="h-4 w-1/3" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6 border-t border-line px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 1 ? "flex-[2]" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
