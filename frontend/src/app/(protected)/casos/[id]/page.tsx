"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { statusLabel, statusColor, slaLabel } from "@/lib/case-status";
import { TRANSITIONS } from "@/lib/transitions";
import { AREAS, TIPOS_INTERVENCION, COMPLEJIDADES, IMPACTOS } from "@/lib/lov";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCard, SkeletonRegion } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";

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

interface Applicant {
  id: number;
  status: string;
  interestStatement: string;
  relevance: string;
  relevantExperience: string;
  isAvailable: boolean;
  createdAt: string;
  consultant: {
    user: { fullName: string; email: string };
    specialty: { label: string } | null;
  };
}

interface SlaInfo {
  state?: "OK" | "POR_VENCER" | "VENCIDO";
  elapsedHours?: number;
  percent?: number;
  sla?: null;
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

function slaColor(state?: string) {
  if (state === "VENCIDO") return "bg-danger-soft text-danger";
  if (state === "POR_VENCER") return "bg-warn-soft text-warn";
  if (state === "OK") return "bg-ok-soft text-ok";
  return "";
}

export default function CasoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [data, setData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [sla, setSla] = useState<SlaInfo | null>(null);
  const [clsAreaId, setClsAreaId] = useState("");
  const [clsInterventionTypeId, setClsInterventionTypeId] = useState("");
  const [clsComplexityId, setClsComplexityId] = useState("");
  const [clsImpactId, setClsImpactId] = useState("");
  const [clsIsEligible, setClsIsEligible] = useState(true);
  const [clsNotes, setClsNotes] = useState("");
  const [clsError, setClsError] = useState<string | null>(null);
  const [clsSubmitting, setClsSubmitting] = useState(false);

  const loadCase = useCallback(() => {
    apiFetch<CaseDetail>(`/api/cases/${id}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el caso"));
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  useEffect(() => {
    if (data?.status === "EN_POSTULACION" && (user?.role === "ADVISORY" || user?.role === "ADMIN")) {
      apiFetch<Applicant[]>(`/api/cases/${id}/applications`)
        .then(setApplicants)
        .catch((err) => setApplicantsError(err instanceof Error ? err.message : "Error al cargar postulantes"));
    }
  }, [data?.status, user, id]);

  useEffect(() => {
    if (!data) return;
    apiFetch<SlaInfo>(`/api/cases/${id}/sla`)
      .then(setSla)
      .catch(() => setSla(null));
  }, [data?.status, id]);

  async function handleAssign(applicationId: number) {
    const name = applicants?.find((a) => a.id === applicationId)?.consultant.user.fullName ?? "este consultor";
    const ok = await confirm({
      title: `¿Asignar a ${name}?`,
      message: "Será el consultor único del caso y los demás postulantes quedarán descartados.",
      confirmLabel: "Asignar consultor",
    });
    if (!ok) return;
    setAssignError(null);
    setAssigningId(applicationId);
    try {
      await apiFetch(`/api/cases/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      });
      toast.success(`${name} quedó asignado al caso.`);
      loadCase();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo asignar el consultor";
      setAssignError(message);
      toast.error(message);
    } finally {
      setAssigningId(null);
    }
  }

  async function handleTransition() {
    if (!selectedTarget) return;
    const isClosing = selectedTarget === "CERRADO" || selectedTarget === "CERRADO_SIN_CONTRATACION";
    const ok = await confirm({
      title: `¿Pasar el caso a "${statusLabel(selectedTarget)}"?`,
      message: isClosing
        ? "Es un estado final: después no habrá más transiciones disponibles."
        : "El cambio queda registrado en el historial del caso.",
      confirmLabel: "Cambiar estado",
      tone: isClosing ? "danger" : "default",
    });
    if (!ok) return;
    setTransitionError(null);
    setTransitioning(true);
    try {
      await apiFetch(`/api/cases/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ targetStatus: selectedTarget, note: note || undefined }),
      });
      toast.success(`Caso en "${statusLabel(selectedTarget)}".`);
      setNote("");
      setSelectedTarget("");
      loadCase();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cambiar el estado";
      setTransitionError(message);
      toast.error(message);
    } finally {
      setTransitioning(false);
    }
  }

  async function handleClassify() {
    if (!clsAreaId || !clsInterventionTypeId || !clsComplexityId || !clsImpactId) {
      setClsError("Completa las 4 categorías antes de clasificar.");
      return;
    }
    setClsError(null);
    setClsSubmitting(true);
    try {
      await apiFetch(`/api/cases/${id}/classification`, {
        method: "POST",
        body: JSON.stringify({
          areaId: Number(clsAreaId),
          interventionTypeId: Number(clsInterventionTypeId),
          complexityId: Number(clsComplexityId),
          impactId: Number(clsImpactId),
          isEligible: clsIsEligible,
          notes: clsNotes || undefined,
        }),
      });
      setClsAreaId("");
      setClsInterventionTypeId("");
      setClsComplexityId("");
      setClsImpactId("");
      setClsIsEligible(true);
      setClsNotes("");
      toast.success("Clasificación registrada.");
      loadCase();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar la clasificación";
      setClsError(message);
      toast.error(message);
    } finally {
      setClsSubmitting(false);
    }
  }

  if (error) {
    return (
      <div>
        <Link href="/casos" className="text-sm text-ink-soft hover:underline">← Volver a Casos</Link>
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <SkeletonRegion label="Cargando caso">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-5 h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
          </div>
          <SkeletonCard lines={6} />
        </div>
      </SkeletonRegion>
    );
  }

  const currentClassification = data.classifications?.[0] ?? null;
  const canTransition = user?.role === "ADVISORY" || user?.role === "ADMIN";
  const availableTargets = TRANSITIONS[data.status] ?? [];

  return (
    <div>
      <Link href="/casos" className="text-sm text-ink-soft hover:underline">← Volver a Casos</Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.caseNumber}</h1>
          <p className="mt-1 text-ink-soft">{data.title}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(data.status)}`}>
            {statusLabel(data.status)}
          </span>
          {sla?.state && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${slaColor(sla.state)}`}>
              SLA: {slaLabel(sla.state)}
              {typeof sla.percent === "number" && ` (${sla.percent}%)`}
              {typeof sla.elapsedHours === "number" && ` · ${sla.elapsedHours}h`}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold text-ink">Descripción</h2>
            <p className="mt-2 text-sm text-ink-soft">{data.description}</p>
            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-ink-muted">Área</dt>
                <dd className="text-ink">{data.area?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Urgencia</dt>
                <dd className="text-ink">{data.urgency?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Impacto</dt>
                <dd className="text-ink">{data.impact?.label ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold text-ink">Empresa y contacto</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-muted">Empresa</dt>
                <dd className="text-ink">{data.company?.name}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Ubicación</dt>
                <dd className="text-ink">{data.company?.city}, {data.company?.country}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Contacto</dt>
                <dd className="text-ink">{data.contact?.fullName} — {data.contact?.position}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Correo / Teléfono</dt>
                <dd className="text-ink">{data.contact?.email} · {data.contact?.phone}</dd>
              </div>
            </dl>
          </section>

          {canTransition && data.status === "EN_REVISION" && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-semibold text-ink">Clasificar caso</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-ink-soft">Área</label>
                  <select
                    value={clsAreaId}
                    onChange={(e) => setClsAreaId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Selecciona…</option>
                    {AREAS.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-ink-soft">Tipo de intervención</label>
                  <select
                    value={clsInterventionTypeId}
                    onChange={(e) => setClsInterventionTypeId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Selecciona…</option>
                    {TIPOS_INTERVENCION.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-ink-soft">Complejidad</label>
                  <select
                    value={clsComplexityId}
                    onChange={(e) => setClsComplexityId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Selecciona…</option>
                    {COMPLEJIDADES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-ink-soft">Impacto</label>
                  <select
                    value={clsImpactId}
                    onChange={(e) => setClsImpactId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Selecciona…</option>
                    {IMPACTOS.map((i) => (
                      <option key={i.id} value={i.id}>{i.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={clsIsEligible}
                  onChange={(e) => setClsIsEligible(e.target.checked)}
                />
                El caso es elegible para continuar el flujo
              </label>

              <textarea
                value={clsNotes}
                onChange={(e) => setClsNotes(e.target.value)}
                placeholder="Notas (opcional)"
                rows={2}
                className="mt-3 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />

              {clsError && (
                <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{clsError}</p>
              )}

              <Button className="mt-3" loading={clsSubmitting} loadingText="Guardando…" onClick={handleClassify}>
                Registrar clasificación
              </Button>
            </section>
          )}

          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-semibold text-ink">Clasificación actual</h2>
            {currentClassification ? (
              <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink-muted">Área</dt>
                  <dd className="text-ink">{currentClassification.area?.label}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Tipo de intervención</dt>
                  <dd className="text-ink">{currentClassification.interventionType?.label}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Complejidad</dt>
                  <dd className="text-ink">{currentClassification.complexity?.label}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Impacto</dt>
                  <dd className="text-ink">{currentClassification.impact?.label}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-muted">Elegible</dt>
                  <dd className={currentClassification.isEligible ? "text-ok" : "text-danger"}>
                    {currentClassification.isEligible ? "Sí" : "No"}
                    {currentClassification.eligibilityNotes && ` — ${currentClassification.eligibilityNotes}`}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Este caso todavía no ha sido clasificado.</p>
            )}
          </section>

          {canTransition && data.status === "EN_POSTULACION" && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-semibold text-ink">Postulantes</h2>

              {applicantsError && (
                <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                  {applicantsError}
                </p>
              )}

              {!applicantsError && !applicants && (
                <SkeletonRegion label="Cargando postulantes" className="mt-3 space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </SkeletonRegion>
              )}

              {applicants && applicants.length === 0 && (
                <p className="mt-2 text-sm text-ink-muted">
                  Aún nadie se postuló. Los consultores con la especialidad del caso lo ven en su bolsa
                  y aparecerán aquí apenas envíen su postulación.
                </p>
              )}

              {assignError && (
                <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                  {assignError}
                </p>
              )}

              <div className="mt-3 space-y-3">
                {applicants?.map((a) => (
                  <div key={a.id} className="rounded-md border border-line p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-ink">{a.consultant.user.fullName}</p>
                        <p className="text-sm text-ink-muted">
                          {a.consultant.user.email} · {a.consultant.specialty?.label ?? "—"}
                        </p>
                      </div>
                      <Button
                        className="px-3 py-1.5"
                        loading={assigningId === a.id}
                        disabled={assigningId !== null && assigningId !== a.id}
                        loadingText="Asignando…"
                        onClick={() => handleAssign(a.id)}
                      >
                        Asignar
                      </Button>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-ink-muted">Interés</dt>
                        <dd className="text-ink-soft">{a.interestStatement}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Pertinencia</dt>
                        <dd className="text-ink-soft">{a.relevance}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Experiencia relevante</dt>
                        <dd className="text-ink-soft">{a.relevantExperience}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {canTransition && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-semibold text-ink">Cambiar estado</h2>

              {availableTargets.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">
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
                            ? "border-primary bg-primary text-on-primary"
                            : "border-line-strong text-ink-soft hover:bg-sunken"
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
                    className="w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                  />

                  {transitionError && (
                    <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                      {transitionError}
                    </p>
                  )}

                  <Button
                    disabled={!selectedTarget}
                    loading={transitioning}
                    loadingText="Aplicando…"
                    onClick={handleTransition}
                  >
                    {selectedTarget ? `Cambiar a "${statusLabel(selectedTarget)}"` : "Elige un estado"}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 lg:self-start">
          <h2 className="font-semibold text-ink">Historial</h2>
          <ol className="mt-4 space-y-4 border-l border-line-strong pl-4">
            {data.stateHistory?.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm text-ink">
                  {h.fromStatus ? (
                    <>
                      <span className="text-ink-muted">{statusLabel(h.fromStatus)}</span>
                      {" → "}
                    </>
                  ) : null}
                  <span className="font-medium">{statusLabel(h.toStatus)}</span>
                </p>
                <p className="text-xs text-ink-muted">
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