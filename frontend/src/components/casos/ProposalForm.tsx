"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Proposal, proposalItems } from "@/lib/proposals";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { StepBlock, StepError } from "@/components/casos/StepCard";

function ListEditor({
  label,
  addLabel,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  addLabel: string;
  values: string[];
  placeholder: string;
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="mt-6 first:mt-0">
      <legend className="label-line mx-auto text-center">{label}</legend>
      {values.map((v, i) => (
        <div key={i} className="mt-1 flex items-center gap-2">
          <input
            value={v}
            aria-label={`${label} ${i + 1}`}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
            className="input-line text-center"
          />
          <button
            type="button"
            aria-label={`Quitar ${label.toLowerCase()} ${i + 1}`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="rounded-full p-1.5 text-ink hover:bg-sunken"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {addLabel}
      </button>
    </fieldset>
  );
}

/** Formulario para escribir la propuesta; cada guardado crea una versión nueva. */
export function ProposalForm({
  caseId,
  base,
  nextVersion,
  onSaved,
  onCancel,
}: {
  caseId: number;
  base: Proposal | null;
  nextVersion: number;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const seed = base ? proposalItems(base) : { activities: [], deliverables: [], phases: [] };
  const [executiveSummary, setExecutiveSummary] = useState(base?.executiveSummary ?? "");
  const [objective, setObjective] = useState(base?.objective ?? "");
  const [scope, setScope] = useState(base?.scope ?? "");
  const [exclusions, setExclusions] = useState(base?.exclusions ?? "");
  const [activities, setActivities] = useState<string[]>(seed.activities);
  const [deliverables, setDeliverables] = useState<string[]>(seed.deliverables);
  const [phases, setPhases] = useState<{ name: string; duration: string }[]>(seed.phases);
  const [valuation, setValuation] = useState(base?.valuation ?? "");
  const [conditions, setConditions] = useState(base?.conditions ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!executiveSummary.trim() || !objective.trim() || !scope.trim()) {
      setError("El resumen ejecutivo, el objetivo y el alcance son obligatorios.");
      return;
    }
    setError(null);
    setSaving(true);
    const clean = (l: string[]) => l.map((x) => x.trim()).filter(Boolean);
    const cleanPhases = phases.map((p) => ({ name: p.name.trim(), duration: p.duration.trim() })).filter((p) => p.name);
    try {
      await apiFetch(`/api/cases/${caseId}/proposals`, {
        method: "POST",
        body: JSON.stringify({
          executiveSummary: executiveSummary.trim(),
          objective: objective.trim(),
          scope: scope.trim(),
          exclusions: exclusions.trim() || undefined,
          activities: { items: clean(activities) },
          deliverables: { items: clean(deliverables) },
          schedule: { phases: cleanPhases },
          valuation: valuation.trim() || undefined,
          conditions: conditions.trim() || undefined,
        }),
      });
      toast.success(`Propuesta v${nextVersion} guardada.`);
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la propuesta";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const text = (label: string, value: string, set: (v: string) => void, hint: string, required = false) => (
    <label className="mt-5 block first:mt-0">
      <span className="label-line text-center">
        {label}
        {!required && " (opcional)"}
      </span>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        rows={2}
        placeholder={hint}
        className="input-line mt-1 resize-none text-center"
      />
    </label>
  );

  return (
    <>
      <StepBlock>
        <p className="text-sm font-semibold text-ink">Versión {nextVersion} · en diseño</p>
        {text("Resumen ejecutivo", executiveSummary, setExecutiveSummary, "De qué trata la propuesta en pocas líneas", true)}
        {text("Objetivo de la intervención", objective, setObjective, "Qué se quiere lograr", true)}
        {text("Alcance", scope, setScope, "Qué incluye el trabajo", true)}
        {text("Exclusiones", exclusions, setExclusions, "Qué no incluye")}
      </StepBlock>

      <StepBlock>
        <ListEditor label="Actividades" addLabel="Agregar actividad" values={activities} placeholder="Ej. Levantamiento en planta" onChange={setActivities} />
        <ListEditor label="Entregables" addLabel="Agregar entregable" values={deliverables} placeholder="Ej. Informe de diagnóstico" onChange={setDeliverables} />

        <fieldset className="mt-6">
          <legend className="label-line mx-auto text-center">Cronograma preliminar</legend>
          {phases.map((p, i) => (
            <div key={i} className="mt-1 flex items-center gap-2">
              <input
                value={p.name}
                aria-label={`Nombre de la fase ${i + 1}`}
                placeholder="Fase"
                onChange={(e) => setPhases(phases.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="input-line flex-1 text-center"
              />
              <input
                value={p.duration}
                aria-label={`Duración de la fase ${i + 1}`}
                placeholder="Duración"
                onChange={(e) => setPhases(phases.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)))}
                className="input-line w-32 text-center"
              />
              <button
                type="button"
                aria-label={`Quitar la fase ${i + 1}`}
                onClick={() => setPhases(phases.filter((_, j) => j !== i))}
                className="rounded-full p-1.5 text-ink hover:bg-sunken"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPhases([...phases, { name: "", duration: "" }])}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar fase
          </button>
        </fieldset>
      </StepBlock>

      <StepBlock>
        {text("Valoración inicial", valuation, setValuation, "Costo estimado y forma de pago")}
        {text("Condiciones y supuestos", conditions, setConditions, "Lo que debe cumplirse para que el plan funcione")}
        {error && <StepError>{error}</StepError>}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={save} loading={saving} loadingText="Guardando…">
            Guardar propuesta v{nextVersion}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          )}
        </div>
      </StepBlock>
    </>
  );
}
