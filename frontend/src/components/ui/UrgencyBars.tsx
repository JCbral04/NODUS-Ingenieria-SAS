import { cn } from "@/lib/utils";

const LEVELS: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };

/** Indicador de urgencia: tres barras, llenas en negro según el nivel. */
export function UrgencyBars({ level, className }: { level?: string | null; className?: string }) {
  const filled = (level && LEVELS[level]) || 0;
  return (
    <span aria-hidden className={cn("inline-flex items-end gap-0.5", className)}>
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          style={{ height: 6 + i * 5 }}
          className={cn("w-[5px] rounded-sm", i < filled ? "bg-ink" : "bg-line-strong")}
        />
      ))}
    </span>
  );
}
