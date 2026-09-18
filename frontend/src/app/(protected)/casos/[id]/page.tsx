"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { statusLabel, statusColor } from "@/lib/case-status";
import { TRANSITIONS } from "@/lib/transitions";

interface LovLabel {
  label: string;
}

interface StateHistoryEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
  actor: { fullName: string } | null;
}

interface Classification {
  id: number;
  area: LovLabel;
  interventionType: LovLabel;
  complexity: LovLabel;
  impact: LovLabel;
  isEligible: boolean;
  eligibilityNotes: string | null;
  createdAt: string;
}

interface CaseDetail {
  id: number;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  company: { name: string; email: string; country: string; city: string };
  contact: { fullName: string; position: string; email: string; phone: string };
  area: LovLabel;
  urgency: LovLabel;
  impact: LovLabel;
  classifications: Classification[];
  stateHistory: StateHistoryEntry[];
}

export default function CasoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [data, setData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const loadCase = useCallback(() => {
    apiFetch<CaseDetail>(`/api/cases/${id}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el caso"));
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  async function handleTransition() {
    if (!selectedTarget) return;
    setTransitionError(null);
    setTransitioning(true);
    try {
      await apiFetch(`/api/cases/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ targetStatus: selectedTarget, note: note || undefined }),
      });
      setNote("");
      setSelectedTarget("");
      loadCase();
    } catch (err) {
      setTransitionError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setTransitioning(false);
    }
  }

  if (error) {
    return (
      <div>
        <Link href="/casos" className="text-sm text-slate-400 hover:underline">← Volver a Casos</Link>
        <p className="mt-4 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Cargando caso…</p>;
  }

  const currentClassification = data.classifications?.[0] ?? null;
  const canTransition = user?.role === "ADVISORY" || user?.role === "ADMIN";
  const availableTargets = TRANSITIONS[data.status] ?? [];

  return (
    <div>
      <Link href="/casos" className="text-sm text-slate-400 hover:underline">← Volver a Casos</Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.caseNumber}</h1>
          <p className="mt-1 text-slate-300">{data.title}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(data.status)}`}>
          {statusLabel(data.status)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-slate-100">Descripción</h2>
            <p className="mt-2 text-sm text-slate-300">{data.description}</p>
            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Área</dt>
                <dd className="text-slate-200">{data.area?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Urgencia</dt>
                <dd className="text-slate-200">{data.urgency?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Impacto</dt>
                <dd className="text-slate-200">{data.impact?.label ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-slate-100">Empresa y contacto</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Empresa</dt>
                <dd className="text-slate-200">{data.company?.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ubicación</dt>
                <dd className="text-slate-200">{data.company?.city}, {data.company?.country}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contacto</dt>
                <dd className="text-slate-200">{data.contact?.fullName} — {data.contact?.position}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Correo / Teléfono</dt>
                <dd className="text-slate-200">{data.contact?.email} · {data.contact?.phone}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-slate-100">Clasificación actual</h2>
            {currentClassification ? (
              <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Área</dt>
                  <dd className="text-slate-200">{currentClassification.area?.label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tipo de intervención</dt>
                  <dd className="text-slate-200">{currentClassification.interventionType?.label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Complejidad</dt>
                  <dd className="text-slate-200">{currentClassification.complexity?.label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Impacto</dt>
                  <dd className="text-slate-200">{currentClassification.impact?.label}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Elegible</dt>
                  <dd className={currentClassification.isEligible ? "text-emerald-400" : "text-red-400"}>
                    {currentClassification.isEligible ? "Sí" : "No"}
                    {currentClassification.eligibilityNotes && ` — ${currentClassification.eligibilityNotes}`}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Este caso todavía no ha sido clasificado.</p>
            )}
          </section>

          {canTransition && (
            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold text-slate-100">Cambiar estado</h2>

              {availableTargets.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Este caso está en un estado final, no tiene transiciones disponibles.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {availableTargets.map((target) => (
                      <button
                        key={target}
                        type="button"
                        onClick={() => setSelectedTarget(target)}
                        className={`rounded-md border px-3 py-1.5 text-sm ${
                          selectedTarget === target
                            ? "border-slate-100 bg-slate-100 text-slate-950"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        → {statusLabel(target)}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nota (opcional)"
                    rows={2}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                  />

                  {transitionError && (
                    <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">
                      {transitionError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={!selectedTarget || transitioning}
                    onClick={handleTransition}
                    className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
                  >
                    {transitioning ? "Aplicando…" : "Confirmar cambio de estado"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-100">Historial</h2>
          <ol className="mt-4 space-y-4 border-l border-slate-700 pl-4">
            {data.stateHistory?.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-500" />
                <p className="text-sm text-slate-200">
                  {h.fromStatus ? (
                    <>
                      <span className="text-slate-500">{statusLabel(h.fromStatus)}</span>
                      {" → "}
                    </>
                  ) : null}
                  <span className="font-medium">{statusLabel(h.toStatus)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {h.actor?.fullName ?? "Sistema"} · {new Date(h.createdAt).toLocaleString("es-CO")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}