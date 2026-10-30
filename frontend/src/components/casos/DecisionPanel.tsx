"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";
import { StepBlock, StepError } from "@/components/casos/StepCard";

/** Decisión del cliente sobre la propuesta: aceptar o no continuar. */
export function DecisionPanel({ caseId, onDone }: { caseId: number; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"ACEPTAR" | "NO_CONTINUAR" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(type: "ACEPTAR" | "NO_CONTINUAR") {
    const accepting = type === "ACEPTAR";
    const ok = await confirm({
      title: accepting ? "¿Aceptar la propuesta?" : "¿No continuar con este caso?",
      message: accepting
        ? "El caso pasa a la contratación con tu consultor."
        : "El caso se cerrará sin contratación y no podrá reabrirse.",
      confirmLabel: accepting ? "Aceptar propuesta" : "No continuar",
      tone: accepting ? "default" : "danger",
    });
    if (!ok) return;
    setError(null);
    setBusy(type);
    try {
      await apiFetch(`/api/cases/${caseId}/decision`, {
        method: "POST",
        body: JSON.stringify({ type, notes: notes.trim() || undefined }),
      });
      toast.success(accepting ? "Aceptaste la propuesta." : "El caso se cerró sin contratación.");
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar tu decisión";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <StepBlock>
      <h3 className="text-xl font-semibold text-ink">Tu decisión</h3>
      <p className="mt-1 text-base text-ink">Puedes aceptar la propuesta o decidir no continuar.</p>
      <label className="mx-auto mt-5 block max-w-xl">
        <span className="label-line text-center">Comentarios (opcional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Si no continúas, cuéntanos el motivo"
          className="input-line mt-1 resize-none text-center"
        />
      </label>
      {error && <StepError>{error}</StepError>}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => decide("ACEPTAR")} loading={busy === "ACEPTAR"} loadingText="Enviando…" disabled={busy !== null}>
          Aceptar propuesta
        </Button>
        <Button variant="secondary" onClick={() => decide("NO_CONTINUAR")} loading={busy === "NO_CONTINUAR"} loadingText="Enviando…" disabled={busy !== null}>
          No continuar
        </Button>
      </div>
      <p className="mt-3 text-sm text-ink">
        Si aceptas, pasa a la contratación con tu consultor. Si no continúas, el caso se cierra.
      </p>
    </StepBlock>
  );
}
