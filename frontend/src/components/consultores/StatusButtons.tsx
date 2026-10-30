"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { CONSULTANT_TRANSITIONS, consultantStatusLabel, type ConsultantProfile } from "@/lib/consultant";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";

/** Botones "Pasar a…" con las transiciones permitidas, confirmación y aviso al terminar. */
export function ConsultantStatusButtons({
  consultant,
  note,
  onChanged,
  label = "Pasa a:",
}: {
  consultant: ConsultantProfile;
  note?: string;
  onChanged: () => void | Promise<void>;
  label?: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [changing, setChanging] = useState<string | null>(null);
  const targets = CONSULTANT_TRANSITIONS[consultant.status] ?? [];

  async function change(target: string) {
    const name = consultant.user.fullName;
    const targetLabel = consultantStatusLabel(target);
    const blocking = target === "SUSPENDIDO" || target === "INACTIVO";
    const ok = await confirm({
      title: `¿Pasar a ${name} a "${targetLabel}"?`,
      message: blocking
        ? "Dejará de poder tomar casos nuevos. Quedará registrado quién hizo el cambio."
        : "El cambio queda registrado con tu nombre.",
      confirmLabel: `Pasar a ${targetLabel}`,
      tone: blocking ? "danger" : "default",
    });
    if (!ok) return;
    setChanging(target);
    try {
      const trimmed = note?.trim();
      await apiFetch(`/api/consultants/${consultant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: target, ...(trimmed ? { note: trimmed } : {}) }),
      });
      toast.success(`${name} ahora está "${targetLabel}".`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setChanging(null);
    }
  }

  if (targets.length === 0) {
    return <p className="text-sm text-ink">Este consultor está inactivo y su estado ya no se puede cambiar.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-ink">{label}</span>
      {targets.map((t) => (
        <Button
          key={t}
          variant={t === "SUSPENDIDO" || t === "INACTIVO" ? "secondary" : "primary"}
          loading={changing === t}
          disabled={changing !== null}
          onClick={() => change(t)}
        >
          {consultantStatusLabel(t)}
        </Button>
      ))}
    </div>
  );
}
