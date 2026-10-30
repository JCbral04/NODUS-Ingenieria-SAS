import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Acción sugerida (botón o enlace). */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-ink">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
