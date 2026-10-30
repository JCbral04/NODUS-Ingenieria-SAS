"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Proposal, proposalItems } from "@/lib/proposals";
import { StepBlock } from "@/components/casos/StepCard";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      <div className="mt-1 text-base text-ink">{children}</div>
    </div>
  );
}

/** Resumen de una propuesta, con la versión completa desplegable y acceso a las versiones anteriores. */
export function ProposalView({ proposals, defaultOpen = false }: { proposals: Proposal[]; defaultOpen?: boolean }) {
  const sorted = [...proposals].sort((a, b) => b.version - a.version);
  const [shownId, setShownId] = useState<number | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  if (sorted.length === 0) return null;

  const p = sorted.find((x) => x.id === shownId) ?? sorted[0];
  const isLatest = p.id === sorted[0].id;
  const { activities, deliverables, phases } = proposalItems(p);

  return (
    <StepBlock>
      <p className="text-sm text-ink">
        Propuesta v{p.version}
        {isLatest ? "" : " · versión anterior"}
      </p>
      <h3 className="mt-1 text-2xl font-semibold leading-snug text-ink">{p.objective}</h3>
      <p className="mx-auto mt-2 max-w-xl text-base text-ink">{p.executiveSummary}</p>

      <dl className="mt-5 flex flex-wrap items-start justify-center gap-x-12 gap-y-3">
        {[
          { k: "Valoración", v: p.valuation?.trim() || "Sin definir" },
          { k: "Cronograma", v: phases.length ? `${phases.length} ${phases.length === 1 ? "fase" : "fases"}` : "Sin definir" },
          { k: "Entregables", v: String(deliverables.length) },
        ].map((m) => (
          <div key={m.k} className="flex flex-col-reverse">
            <dd className="text-base font-semibold text-ink">{m.v}</dd>
            <dt className="text-sm text-ink">{m.k}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-semibold text-ink underline underline-offset-4"
        >
          {open ? "Ocultar propuesta completa" : "Ver propuesta completa"}
        </button>
        {sorted.length > 1 &&
          sorted
            .filter((x) => x.id !== p.id)
            .map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setShownId(x.id);
                  setOpen(true);
                }}
                className="text-sm font-semibold text-ink underline underline-offset-4"
              >
                Ver versión {x.version}
              </button>
            ))}
      </div>

      {open && (
        <div className={cn("mx-auto mt-6 max-w-xl border-t border-line pt-6")}>
          <Section title="Alcance">{p.scope}</Section>
          {p.exclusions && <Section title="Exclusiones">{p.exclusions}</Section>}
          {activities.length > 0 && (
            <Section title="Actividades">
              <ul className="space-y-0.5">
                {activities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>
          )}
          {deliverables.length > 0 && (
            <Section title="Entregables">
              <ul className="space-y-0.5">
                {deliverables.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>
          )}
          {phases.length > 0 && (
            <Section title="Cronograma preliminar">
              <ul className="space-y-0.5">
                {phases.map((ph, i) => (
                  <li key={i}>
                    {ph.name} · <span className="font-semibold">{ph.duration}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {p.conditions && <Section title="Condiciones y supuestos">{p.conditions}</Section>}
        </div>
      )}
    </StepBlock>
  );
}
