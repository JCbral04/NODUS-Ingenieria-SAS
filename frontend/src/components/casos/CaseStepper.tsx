import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLOW_STEPS, flowStates } from "@/lib/case-flow";

/** Barra de etapas del caso: hechas en verde, la actual en negro y las que faltan en gris. */
export function CaseStepper({ status }: { status: string }) {
  const states = flowStates(status);
  const current = states.indexOf("current");

  return (
    <nav aria-label="Etapas del caso" className="mx-auto max-w-[980px]">
      <ol className="flex items-start">
        {FLOW_STEPS.map((s, i) => {
          const state = states[i];
          return (
            <li
              key={s.key}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "relative flex-1 text-center text-xs sm:text-[13px]",
                // Línea que une con la etapa siguiente.
                i < FLOW_STEPS.length - 1 &&
                  "after:absolute after:left-[calc(50%+14px)] after:right-[calc(-50%+14px)] after:top-3 after:h-0.5 after:content-['']",
                i < FLOW_STEPS.length - 1 && (state === "done" ? "after:bg-primary" : "after:bg-line-strong"),
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mx-auto mb-2 grid h-[26px] w-[26px] place-items-center rounded-full border-2 text-[13px] font-bold",
                  state === "done" && "border-primary bg-primary text-white",
                  state === "current" && "border-ink bg-ink text-white shadow-[0_0_0_5px_rgb(var(--ink)/0.13)]",
                  state === "todo" && "border-line-strong bg-surface text-ink",
                )}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "block text-ink",
                  state === "todo" ? "font-normal" : "font-bold",
                  // En celular solo se nombra la etapa actual.
                  state !== "current" && "max-sm:sr-only",
                )}
              >
                {s.label}
                <span className="sr-only">{state === "done" ? " (hecha)" : state === "current" ? " (actual)" : " (pendiente)"}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {current >= 0 && (
        <p className="mt-2 text-center text-sm text-ink sm:hidden">
          Etapa {current + 1} de {FLOW_STEPS.length}
        </p>
      )}
    </nav>
  );
}
