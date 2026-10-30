"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { UrgencyBars } from "@/components/ui/UrgencyBars";
import { useToast } from "@/components/ui/Toast";

interface PoolCase {
  id: number;
  caseNumber: string;
  title: string;
  area: string | null;
  urgency: string | null;
  interventionType: string | null;
  complexity: string | null;
  publishedAt: string;
}

interface Draft {
  interestStatement: string;
  relevance: string;
  relevantExperience: string;
  isAvailable: boolean;
}

const EMPTY_DRAFT: Draft = { interestStatement: "", relevance: "", relevantExperience: "", isAvailable: true };
const URGENCY_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
const COMPLEXITY_LEVEL: Record<string, number> = { Bajo: 1, Medio: 2, Alto: 3, Estratégico: 4 };

function publishedText(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

export default function WorkflowPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<PoolCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const load = useCallback(() => {
    setError(null);
    setCases(null);
    apiFetch<PoolCase[]>("/api/cases/pool")
      .then((list) =>
        // Primero lo más urgente y, a igual urgencia, lo más reciente.
        setCases(
          [...list].sort(
            (a, b) =>
              (URGENCY_ORDER[a.urgency ?? ""] ?? 3) - (URGENCY_ORDER[b.urgency ?? ""] ?? 3) ||
              new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          ),
        ),
      )
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar la bolsa"));
  }, []);

  useEffect(() => {
    if (user?.role === "CONSULTOR") load();
  }, [user, load]);

  const urgentCount = useMemo(
    () => (cases ?? []).filter((c) => c.urgency === "Alta" && !applied.has(c.id)).length,
    [cases, applied],
  );

  if (user?.role !== "CONSULTOR") {
    return (
      <div>
        <PageHeader title="Workflow" centered />
        <p className="mx-auto mt-8 max-w-md text-center text-base text-ink">
          La bolsa de casos disponibles solo aplica al rol Consultor.
        </p>
      </div>
    );
  }

  const total = cases?.length ?? 0;
  const current = cases && cases.length > 0 ? cases[Math.min(index, cases.length - 1)] : null;

  return (
    <div>
      <PageHeader title="Bolsa de casos" centered>
        {cases && cases.length > 0 && (
          <dl className="mt-6 flex items-start justify-center gap-10 sm:gap-16">
            {[
              { n: total, label: "para ti" },
              { n: urgentCount, label: "urgentes" },
              { n: applied.size, label: applied.size === 1 ? "postulado" : "postulados" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-white/90">{s.label}</dt>
                <dd className="text-4xl font-bold leading-none sm:text-5xl">{s.n}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHeader>

      {error && (
        <div className="mt-8 text-center">
          <p role="alert" className="mx-auto max-w-md rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-left text-sm text-ink">
            {error}
          </p>
          <Button variant="secondary" className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      )}

      {!error && !cases && (
        <SkeletonRegion label="Cargando bolsa de casos" className="mx-auto mt-10 max-w-[760px]">
          <Skeleton className="mx-auto h-10 w-48" />
          <Skeleton className="mt-8 h-[480px] w-full rounded-3xl" />
        </SkeletonRegion>
      )}

      {cases && cases.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title="No hay casos para tu especialidad por ahora"
            description="Cuando Advisory publique un caso que encaje con tu perfil, aparecerá aquí para que te postules."
          />
        </div>
      )}

      {cases && current && (
        <section aria-label="Casos disponibles" className="mt-8">
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="Caso anterior"
              onClick={() => setIndex((index - 1 + total) % total)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:bg-sunken"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <p aria-live="polite" className="min-w-[5rem] text-center text-lg font-semibold text-ink">
              {Math.min(index, total - 1) + 1} de {total}
            </p>
            <button
              type="button"
              aria-label="Caso siguiente"
              onClick={() => setIndex((index + 1) % total)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:bg-sunken"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {cases.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-label={`Ir al caso ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : applied.has(c.id) ? "w-2.5 bg-ink" : "w-2.5 bg-line-strong",
                )}
              />
            ))}
          </div>

          <CaseCard
            key={current.id}
            caseItem={current}
            hasApplied={applied.has(current.id)}
            draft={drafts[current.id] ?? EMPTY_DRAFT}
            onDraft={(d) => setDrafts((prev) => ({ ...prev, [current.id]: d }))}
            onApplied={() => setApplied((prev) => new Set(prev).add(current.id))}
            onNext={total > 1 ? () => setIndex((index + 1) % total) : undefined}
          />
        </section>
      )}
    </div>
  );
}

function Meter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-sm text-ink">{label}</p>
      <div className="mt-1.5 flex min-h-[1.5rem] items-center justify-center gap-2 text-base font-semibold text-ink">
        {children}
      </div>
    </div>
  );
}

function CaseCard({
  caseItem,
  hasApplied,
  draft,
  onDraft,
  onApplied,
  onNext,
}: {
  caseItem: PoolCase;
  hasApplied: boolean;
  draft: Draft;
  onDraft: (d: Draft) => void;
  onApplied: () => void;
  onNext?: () => void;
}) {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const level = COMPLEXITY_LEVEL[caseItem.complexity ?? ""] ?? 0;

  async function handleApply() {
    if (!draft.interestStatement.trim() || !draft.relevance.trim() || !draft.relevantExperience.trim()) {
      setError("Completa los 3 campos de texto antes de postularte.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/api/cases/${caseItem.id}/apply`, {
        method: "POST",
        body: JSON.stringify(draft),
      });
      toast.success(`Te postulaste al caso ${caseItem.caseNumber}.`);
      onApplied();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar la postulación";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const fields: { key: "interestStatement" | "relevance" | "relevantExperience"; label: string; hint: string }[] = [
    { key: "interestStatement", label: "¿Por qué te interesa este caso?", hint: "Cuéntanos qué te motiva" },
    { key: "relevance", label: "Pertinencia de tu perfil", hint: "Por qué tu perfil encaja con el caso" },
    { key: "relevantExperience", label: "Experiencia relevante", hint: "Proyectos o trabajos parecidos" },
  ];

  return (
    <article className="card mx-auto mt-8 max-w-[760px] px-5 py-8 text-center sm:px-12 sm:py-10">
      <p className="text-sm text-ink">
        {caseItem.caseNumber} · publicado {publishedText(caseItem.publishedAt)}
      </p>
      <h2 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">{caseItem.title}</h2>
      {(caseItem.area || caseItem.interventionType) && (
        <p className="mt-2 text-base text-ink">
          {[caseItem.area, caseItem.interventionType].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-center gap-x-14 gap-y-4 border-y border-line py-5">
        <Meter label="Urgencia">
          {caseItem.urgency ? (
            <>
              <UrgencyBars level={caseItem.urgency} />
              {caseItem.urgency}
            </>
          ) : (
            "Sin definir"
          )}
        </Meter>
        <Meter label="Complejidad">
          {caseItem.complexity ? (
            <>
              <span aria-hidden className="inline-flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} className={cn("h-2.5 w-2.5 rounded-full border-[1.5px] border-ink", i < level && "bg-ink")} />
                ))}
              </span>
              {caseItem.complexity}
            </>
          ) : (
            "Sin definir"
          )}
        </Meter>
      </div>

      {hasApplied ? (
        <div className="py-8">
          <p className="text-2xl font-bold text-primary">Ya te postulaste a este caso</p>
          <p className="mt-2 text-base text-ink">Advisory revisará tu postulación.</p>
          {onNext && (
            <Button variant="secondary" className="mt-6" onClick={onNext}>
              Ver el siguiente caso
            </Button>
          )}
        </div>
      ) : (
        <>
          <h3 className="mt-7 text-xl font-semibold text-ink">Tu postulación</h3>
          <div className="mt-2 space-y-5">
            {fields.map((f) => (
              <label key={f.key} className="mt-4 block">
                <span className="label-line">{f.label}</span>
                <textarea
                  value={draft[f.key]}
                  onChange={(e) => onDraft({ ...draft, [f.key]: e.target.value })}
                  rows={2}
                  placeholder={f.hint}
                  className="input-line mt-1 resize-none text-center"
                />
              </label>
            ))}
          </div>
          <label className="mt-6 flex items-center justify-center gap-2 text-base text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={draft.isAvailable}
              onChange={(e) => onDraft({ ...draft, isAvailable: e.target.checked })}
            />
            Tengo disponibilidad para este caso ahora
          </label>

          {error && (
            <p role="alert" className="mx-auto mt-4 max-w-md rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-left text-sm text-ink">
              {error}
            </p>
          )}

          <Button className="mt-6" loading={submitting} loadingText="Enviando…" onClick={handleApply}>
            Enviar postulación
          </Button>
        </>
      )}
    </article>
  );
}
