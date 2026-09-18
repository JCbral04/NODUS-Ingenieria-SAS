"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
        <h1 className="text-2xl font-bold">Workflow</h1>
        <p className="mt-4 text-sm text-slate-500">
          La bolsa de casos disponibles solo aplica al rol Consultor.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bolsa de casos disponibles</h1>
      <p className="mt-1 text-sm text-slate-400">
        Casos publicados que coinciden con tu especialidad.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {!error && !cases && <p className="mt-6 text-sm text-slate-500">Cargando bolsa…</p>}

      {cases && cases.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No hay casos disponibles para tu especialidad en este momento.
        </p>
      )}

      <div className="mt-6 space-y-4">
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
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la postulación");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{caseItem.caseNumber}</p>
          <h3 className="font-semibold text-slate-100">{caseItem.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
            {caseItem.area && <span className="rounded-full bg-slate-800 px-2 py-1">{caseItem.area}</span>}
            {caseItem.interventionType && (
              <span className="rounded-full bg-slate-800 px-2 py-1">{caseItem.interventionType}</span>
            )}
            {caseItem.complexity && (
              <span className="rounded-full bg-slate-800 px-2 py-1">Complejidad: {caseItem.complexity}</span>
            )}
            {caseItem.urgency && (
              <span className="rounded-full bg-slate-800 px-2 py-1">Urgencia: {caseItem.urgency}</span>
            )}
          </div>
        </div>

        {hasApplied ? (
          <span className="rounded-md bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-300">
            Postulado ✓
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            {isOpen ? "Cancelar" : "Postularme"}
          </button>
        )}
      </div>

      {isOpen && !hasApplied && (
        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
          <div>
            <label className="block text-sm text-slate-400">¿Por qué te interesa este caso?</label>
            <textarea
              value={interestStatement}
              onChange={(e) => setInterestStatement(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Pertinencia de tu perfil</label>
            <textarea
              value={relevance}
              onChange={(e) => setRelevance(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Experiencia relevante</label>
            <textarea
              value={relevantExperience}
              onChange={(e) => setRelevantExperience(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Tengo disponibilidad para este caso ahora
          </label>

          {error && (
            <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleApply}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando…" : "Enviar postulación"}
          </button>
        </div>
      )}
    </div>
  );
}