export interface ProposalReview {
  id: number;
  approved: boolean;
  observations: string | null;
  adjustmentRequest: string | null;
  checklist: Record<string, boolean>;
  createdAt: string;
}

export interface Proposal {
  id: number;
  caseId: number;
  version: number;
  status: string;
  executiveSummary: string;
  objective: string;
  scope: string;
  exclusions: string | null;
  activities: { items?: string[] } | null;
  deliverables: { items?: string[] } | null;
  schedule: { phases?: { name: string; duration: string }[] } | null;
  valuation: string | null;
  conditions: string | null;
  createdAt: string;
  reviews: ProposalReview[];
}

/** Revisión de calidad (QA): las 6 comprobaciones que guarda el backend. */
export const QA_CHECKS = [
  { key: "completa", label: "La propuesta está completa" },
  { key: "plantillas", label: "Usa las plantillas" },
  { key: "coherencia", label: "Es coherente con el caso" },
  { key: "cronograma", label: "Cronograma realista" },
  { key: "exclusiones", label: "Exclusiones claras" },
  { key: "supuestos", label: "Supuestos explícitos" },
] as const;

export function proposalItems(p: Proposal) {
  return {
    activities: p.activities?.items ?? [],
    deliverables: p.deliverables?.items ?? [],
    phases: p.schedule?.phases ?? [],
  };
}

/** La más reciente primero (el backend ya las devuelve así, pero no se depende de ello). */
export function latestProposal(list: Proposal[]) {
  return [...list].sort((a, b) => b.version - a.version)[0] ?? null;
}
