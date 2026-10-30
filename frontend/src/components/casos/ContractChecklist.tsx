"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { StepBlock, StepError } from "@/components/casos/StepCard";

interface ChecklistItem {
  id: number;
  label: string;
  responsible: string;
  status: string;
  evidence: string | null;
  completedAt: string | null;
}

const RESPONSIBLE: Record<string, string> = { CONSULTOR: "Consultor", CLIENTE: "Cliente", ADVISORY: "Advisory" };

/** Checklist de contratación (T7A): sin completarlo no se autoriza la ejecución (RF-070). */
export function ContractChecklist({
  caseId,
  status,
  canManage,
  onAuthorized,
}: {
  caseId: number;
  status: string;
  canManage: boolean;
  onAuthorized: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [evidence, setEvidence] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ChecklistItem[]>(`/api/cases/${caseId}/contract/items`)
      .then((list) => {
        setItems(list);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el checklist"));
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = items?.length ?? 0;
  const done = items?.filter((i) => i.status === "COMPLETADO").length ?? 0;
  const pending = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const authorizable = canManage && status === "PENDIENTE_CONTRATACION";

  async function complete(item: ChecklistItem) {
    setActionError(null);
    setSavingId(item.id);
    try {
      await apiFetch(`/api/cases/${caseId}/contract/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ evidence: evidence.trim() || undefined }),
      });
      toast.success("Paso marcado como completado.");
      setEditingId(null);
      setEvidence("");
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo marcar el paso";
      setActionError(message);
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  }

  async function authorize() {
    const ok = await confirm({
      title: "¿Autorizar la ejecución?",
      message: "El caso pasa a \"Autorizado para ejecución\" y queda registrado en el historial.",
      confirmLabel: "Autorizar ejecución",
    });
    if (!ok) return;
    setActionError(null);
    setAuthorizing(true);
    try {
      await apiFetch(`/api/cases/${caseId}/contract/authorize`, { method: "POST" });
      toast.success("Ejecución autorizada.");
      onAuthorized();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo autorizar la ejecución";
      setActionError(message);
      toast.error(message);
      load();
    } finally {
      setAuthorizing(false);
    }
  }

  if (error && !items) {
    return (
      <StepBlock>
        <StepError>{error}</StepError>
        <Button variant="secondary" className="mt-4" onClick={load}>
          Reintentar
        </Button>
      </StepBlock>
    );
  }

  if (!items) {
    return (
      <StepBlock>
        <div aria-busy="true" className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </StepBlock>
    );
  }

  return (
    <>
      <div className="px-6 pb-6">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="Pasos del checklist completados"
          className="mx-auto h-2.5 max-w-sm rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-ink">
          {done} de {total} pasos listos
        </p>
      </div>

      <ul className="border-t border-line text-left">
        {items.map((item) => {
          const isDone = item.status === "COMPLETADO";
          const editing = editingId === item.id;
          return (
            <li key={item.id} className="border-b border-line px-6 py-4 last:border-b-0 sm:px-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span
                  aria-hidden
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border-2",
                    isDone ? "border-primary bg-primary text-white" : "border-ink",
                  )}
                >
                  {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <div className="min-w-[11rem] flex-1">
                  <p className="text-base font-semibold text-ink">{item.label}</p>
                  <p className="text-sm text-ink">
                    Responsable: {RESPONSIBLE[item.responsible] ?? item.responsible}
                    {isDone && item.evidence ? ` · ${item.evidence}` : ""}
                  </p>
                </div>
                {isDone ? (
                  <span className="shrink-0 text-sm font-semibold text-primary">Completado</span>
                ) : (
                  authorizable &&
                  !editing && (
                    <Button
                      variant="secondary"
                      className="ml-10 shrink-0 sm:ml-0"
                      aria-label={`Marcar completado: ${item.label}`}
                      onClick={() => {
                        setEditingId(item.id);
                        setEvidence("");
                        setActionError(null);
                      }}
                    >
                      Marcar completado
                    </Button>
                  )
                )}
              </div>
              {editing && (
                <div className="mt-3 pl-10">
                  <label className="block">
                    <span className="label-line">Evidencia (opcional)</span>
                    <input
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      placeholder="Ej. Contrato firmado el 12 de octubre"
                      className="input-line"
                    />
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <Button onClick={() => complete(item)} loading={savingId === item.id} loadingText="Guardando…">
                      Guardar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm font-semibold text-ink underline underline-offset-4"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(authorizable || actionError) && (
        <StepBlock className="text-center">
          {actionError && <StepError>{actionError}</StepError>}
          {authorizable && pending > 0 && (
            <p className="mx-auto mt-0 inline-block rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-left text-sm text-ink">
              Faltan {pending} {pending === 1 ? "paso" : "pasos"} del checklist: no se puede autorizar todavía.
            </p>
          )}
          {authorizable && (
            <div className="mt-4">
              <Button onClick={authorize} disabled={pending > 0} loading={authorizing} loadingText="Autorizando…">
                Autorizar ejecución
              </Button>
            </div>
          )}
        </StepBlock>
      )}
    </>
  );
}
