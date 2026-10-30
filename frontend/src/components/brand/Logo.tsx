import { cn } from "@/lib/utils";

/**
 * Marca NODUS: una "N" trazada a través de cuatro nodos.
 * El nodo final (arriba a la derecha) va en naranja: el caso que llega a destino.
 * Mantener sincronizado con src/app/icon.svg.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="NODUS"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#0B6B58" />
      <path
        d="M9 23V9l14 14V9"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="23" r="2.6" fill="#FFFFFF" />
      <circle cx="9" cy="9" r="2.6" fill="#FFFFFF" />
      <circle cx="23" cy="23" r="2.6" fill="#FFFFFF" />
      <circle cx="23" cy="9" r="2.9" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({
  tone = "dark",
  className,
}: {
  /** "dark": texto oscuro para fondos claros. "light": texto claro para la barra verde. */
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-bold tracking-tight",
            tone === "light" ? "text-white" : "text-ink"
          )}
        >
          NODUS
        </span>
        <span
          className={cn(
            "mt-1 block text-xs",
            tone === "light" ? "text-sidebar-ink" : "text-ink-muted"
          )}
        >
          Ingeniería SAS
        </span>
      </div>
    </div>
  );
}
