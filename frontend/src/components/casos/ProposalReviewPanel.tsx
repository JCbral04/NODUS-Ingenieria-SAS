"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Proposal, QA_CHECKS } from "@/lib/proposals";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { StepBlock, StepError } from "@/components/casos/StepCard";

/** Revisión de calidad de la propuesta (Advisory): aprobar o pedir ajustes. */
export function ProposalReviewPanel({ proposal, onDone }: { proposal: Proposal; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(QA_CHECKS.map((c) => [c.key, false])),
  );
  const [observations, setObservations] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "adjust" | null>(null);

  async function submit(approved: boolean) {
    if (approved && !QA_CHECKS.every((c) => checks[c.key])) {
      setError("Marca las 6 comprobaciones para poder aprobar la propuesta.");
      return;
    }
    if (!approved && !adjustment.trim()) {
      setError("Cuéntale al consultor qué debe ajustar.");
      return;
    }
    const ok = await confirm({
      title: approved ? `¿Aprobar la propuesta v${proposal.version}?` : "¿Pedir ajustes al consultor?",
      message: approved
        ? "Quedará lista para enviarla al cliente."
        : "El consultor verá tu solicitud y podrá guardar una versión nueva.",
      confirmLabel: approved ? "Aprobar propuesta" : "Pedir ajustes",
    });
    if (!ok) return;
    setError(null);
    setBusy(approved ? "approve" : "adjust");
    try {
      await apiFetch(`/api/proposals/${proposal.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          checklist: checks,
          approved,
          observations: observations.trim() || undefined,
          adjustmentRequest: approved ? undefined : adjustment.trim(),
        }),
      });
      toast.success(approved ? "Propuesta aprobada." : "Se pidieron ajustes al consultor.");
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la revisión";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <StepBlock>
      <h3 className="text-xl font-semibold text-ink">Revisión de calidad</h3>
      <ul className="mx-auto mt-3 max-w-xl divide-y divide-line border-y border-line text-left">
        {QA_CHECKS.map((c) => (
          <li key={c.key}>
            <label className="flex cursor-pointer items-center gap-3 px-1 py-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={checks[c.key]}
                onChange={(e) => setChecks({ ...checks, [c.key]: e.target.checked })}
              />
              <span className="text-base font-semibold text-ink">{c.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <label className="mx-auto mt-5 block max-w-xl">
        <span className="label-line text-center">Observaciones (opcional)</span>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={2}
          placeholder="Comentarios para el expediente"
          className="input-line mt-1 resize-none text-center"
        />
      </label>

      {adjusting && (
        <label className="mx-auto mt-5 block max-w-xl">
          <span className="label-line text-center">¿Qué debe ajustar el consultor?</span>
          <textarea
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            rows={3}
            placeholder="Describe los cambios que necesitas"
            className="input-line mt-1 resize-none text-center"
          />
        </label>
      )}

      {error && <StepError>{error}</StepError>}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => submit(true)} loading={busy === "approve"} loadingText="Aprobando…" disabled={busy !== null}>
          Aprobar propuesta
        </Button>
        {adjusting ? (
          <>
            <Button variant="secondary" onClick={() => submit(false)} loading={busy === "adjust"} loadingText="Enviando…" disabled={busy !== null}>
              Enviar solicitud de ajustes
            </Button>
            <button
              type="button"
              onClick={() => {
                setAdjusting(false);
                setError(null);
              }}
              className="text-sm font-semibold text-ink underline underline-offset-4"
            >
              Cancelar
            </button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setAdjusting(true)} disabled={busy !== null}>
            Pedir ajustes
          </Button>
        )}
      </div>
      <p className={cn("mt-3 text-sm text-ink")}>Al aprobar, podrás enviarla al cliente.</p>
    </StepBlock>
  );
}

/** Envío formal de la propuesta aprobada al cliente (Advisory). */
export function SendProposalPanel({ proposal, onDone }: { proposal: Proposal; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const ok = await confirm({
      title: `¿Enviar la propuesta v${proposal.version} al cliente?`,
      message: "El cliente recibirá una notificación y podrá aceptarla o decidir no continuar.",
      confirmLabel: "Enviar al cliente",
    });
    if (!ok) return;
    setError(null);
    setSending(true);
    try {
      await apiFetch(`/api/proposals/${proposal.id}/send`, { method: "POST" });
      toast.success("Propuesta enviada al cliente.");
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar la propuesta";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <StepBlock>
      <p className="text-base text-ink">La propuesta aprobó la revisión de calidad y está lista para el cliente.</p>
      {error && <StepError>{error}</StepError>}
      <Button className="mt-5" onClick={send} loading={sending} loadingText="Enviando…">
        Enviar al cliente
      </Button>
    </StepBlock>
  );
}
