"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";

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

export default function WorkflowPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<PoolCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user?.role !== "CONSULTOR") return;
    apiFetch<PoolCase[]>("/api/cases/pool")
      .then(setCases)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar la bolsa"));
  }, [user]);

  if (user?.role !== "CONSULTOR") {
    return (
      <div>
        <PageHeader title="Workflow" />
        <p className="mt-4 text-sm text-ink-muted">
          La bolsa de casos disponibles solo aplica al rol Consultor.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bolsa de casos"
        description="Casos publicados que coinciden con tu especialidad."
      />

      {error && (
        <p className="mt-4 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">{error}</p>
      )}

      {!error && !cases && (
        <SkeletonRegion label="Cargando bolsa de casos" className="card mt-6 divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-5 w-2/3" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </SkeletonRegion>
      )}

      {cases && cases.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="No hay casos para tu especialidad por ahora"
            description="Cuando Advisory publique un caso que encaje con tu perfil, aparecerá aquí para que te postules."
          />
        </div>
      )}

      <div className="card mt-6 divide-y divide-line">
        {cases?.map((c) => (
          <PoolCaseCard
            key={c.id}
            caseItem={c}
            isOpen={openId === c.id}
            hasApplied={applied.has(c.id)}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
            onApplied={() => setApplied((prev) => new Set(prev).add(c.id))}
          />
        ))}
      </div>
    </div>
  );
}

function PoolCaseCard({
  caseItem,
  isOpen,
  hasApplied,
  onToggle,
  onApplied,
}: {
  caseItem: PoolCase;
  isOpen: boolean;
  hasApplied: boolean;
  onToggle: () => void;
  onApplied: () => void;
}) {
  const [interestStatement, setInterestStatement] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [relevance, setRelevance] = useState("");
  const [relevantExperience, setRelevantExperience] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleApply() {
    if (!interestStatement || !relevance || !relevantExperience) {
      setError("Completa los 3 campos de texto antes de postularte.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/api/cases/${caseItem.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ interestStatement, isAvailable, relevance, relevantExperience }),
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

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{caseItem.caseNumber}</p>
          <h3 className="text-lg font-semibold text-ink">{caseItem.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
            {caseItem.area && <span className="rounded-full bg-sunken px-2 py-1">{caseItem.area}</span>}
            {caseItem.interventionType && (
              <span className="rounded-full bg-sunken px-2 py-1">{caseItem.interventionType}</span>
            )}
            {caseItem.complexity && (
              <span className="rounded-full bg-sunken px-2 py-1">Complejidad: {caseItem.complexity}</span>
            )}
            {caseItem.urgency && (
              <span className="rounded-full bg-sunken px-2 py-1">Urgencia: {caseItem.urgency}</span>
            )}
          </div>
        </div>

        {hasApplied ? (
          <span className="rounded-full bg-ok-soft px-4 py-1.5 text-sm font-semibold text-ink">
            Postulado ✓
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-line-strong px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
          >
            {isOpen ? "Cancelar" : "Postularme"}
          </button>
        )}
      </div>

      {isOpen && !hasApplied && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div>
            <label className="label-line">¿Por qué te interesa este caso?</label>
            <textarea
              value={interestStatement}
              onChange={(e) => setInterestStatement(e.target.value)}
              rows={2}
              className="input-line mt-1"
            />
          </div>
          <div>
            <label className="label-line">Pertinencia de tu perfil</label>
            <textarea
              value={relevance}
              onChange={(e) => setRelevance(e.target.value)}
              rows={2}
              className="input-line mt-1"
            />
          </div>
          <div>
            <label className="label-line">Experiencia relevante</label>
            <textarea
              value={relevantExperience}
              onChange={(e) => setRelevantExperience(e.target.value)}
              rows={2}
              className="input-line mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Tengo disponibilidad para este caso ahora
          </label>

          {error && (
            <p className="rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">{error}</p>
          )}

          <Button loading={submitting} loadingText="Enviando…" onClick={handleApply}>
            Enviar postulación
          </Button>
        </div>
      )}
    </div>
  );
}