"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FLOW_STEPS, STATUS_WAITING, flowStepIndex } from "@/lib/case-flow";
import { Proposal, latestProposal } from "@/lib/proposals";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StepBlock, StepCard, StepError } from "@/components/casos/StepCard";
import { ProposalView } from "@/components/casos/ProposalView";
import { ProposalForm } from "@/components/casos/ProposalForm";
import { ProposalReviewPanel, SendProposalPanel } from "@/components/casos/ProposalReviewPanel";
import { DecisionPanel } from "@/components/casos/DecisionPanel";
import { ContractChecklist } from "@/components/casos/ContractChecklist";

const PROPOSAL_STATUSES = [
  "ASIGNADO",
  "PROPUESTA_EN_DISENO",
  "PROPUESTA_LISTA_QA",
  "AJUSTES_PROPUESTA",
  "PROPUESTA_ENVIADA",
  "EN_DECISION_CLIENTE",
  "PROPUESTA_ACEPTADA",
];

/**
 * Tarjeta del paso actual del caso. Según el estado y el rol muestra lo que esa persona
 * puede hacer ahora; si no le toca nada, explica qué se está esperando.
 */
export function CaseStepPanel({
  caseId,
  status,
  assignedConsultantUserId,
  contactUserId,
  onChanged,
}: {
  caseId: number;
  status: string;
  assignedConsultantUserId?: number | null;
  contactUserId?: number | null;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [writingNew, setWritingNew] = useState(false);

  const needsProposals = PROPOSAL_STATUSES.includes(status);

  const loadProposals = useCallback(() => {
    apiFetch<Proposal[]>(`/api/cases/${caseId}/proposals`)
      .then((list) => {
        setProposals(list);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la propuesta"));
  }, [caseId]);

  useEffect(() => {
    setWritingNew(false);
    if (needsProposals) loadProposals();
  }, [needsProposals, status, loadProposals]);

  const changed = () => {
    setWritingNew(false);
    onChanged();
    if (needsProposals) loadProposals();
  };

  const isStaff = user?.role === "ADVISORY" || user?.role === "ADMIN";
  const isAssignedConsultant = user?.role === "CONSULTOR" && !!user && assignedConsultantUserId === user.id;
  const isContact = user?.role === "MIPYME" && !!user && contactUserId === user.id;

  const stepIdx = flowStepIndex(status);
  const stepLabel = stepIdx >= 0 ? FLOW_STEPS[stepIdx].label : "Caso";
  const waiting = STATUS_WAITING[status];

  // --- Contratación: el checklist lo ven todos y lo gestiona Advisory ---
  if (status === "PENDIENTE_CONTRATACION" || status === "AUTORIZADO_EJECUCION") {
    return (
      <StepCard
        title="Contratación"
        subtitle={
          status === "PENDIENTE_CONTRATACION"
            ? isStaff
              ? "Completa el checklist para poder autorizar la ejecución."
              : "Advisory completa el checklist para autorizar la ejecución."
            : "El checklist está completo y la ejecución está autorizada."
        }
      >
        <ContractChecklist caseId={caseId} status={status} canManage={isStaff} onAuthorized={changed} />
      </StepCard>
    );
  }

  // --- Pasos con propuesta ---
  if (needsProposals) {
    if (error && !proposals) {
      return (
        <StepCard title={stepLabel} subtitle={waiting}>
          <StepBlock>
            <StepError>{error}</StepError>
            <Button variant="secondary" className="mt-4" onClick={loadProposals}>
              Reintentar
            </Button>
          </StepBlock>
        </StepCard>
      );
    }
    if (!proposals) {
      return (
        <StepCard title={stepLabel} subtitle={waiting}>
          <StepBlock>
            <div aria-busy="true" className="space-y-3">
              <Skeleton className="mx-auto h-6 w-2/3" />
              <Skeleton className="mx-auto h-4 w-full" />
              <Skeleton className="mx-auto h-4 w-5/6" />
            </div>
          </StepBlock>
        </StepCard>
      );
    }

    const latest = latestProposal(proposals);
    const lastReview = latest?.reviews?.[0];
    const adjustmentAsked = lastReview && !lastReview.approved ? lastReview : null;
    const canWrite = isAssignedConsultant && ["ASIGNADO", "PROPUESTA_EN_DISENO", "AJUSTES_PROPUESTA"].includes(status);

    // El consultor escribe la propuesta (o una versión nueva)
    if (canWrite) {
      const showForm = !latest || writingNew || status === "AJUSTES_PROPUESTA";
      return (
        <StepCard
          title="Propuesta"
          subtitle={
            latest
              ? "Tu propuesta está en revisión. Si necesitas cambiar algo, guarda una versión nueva."
              : "Escribe la propuesta para este caso. Cada cambio se guarda como una versión nueva."
          }
        >
          {adjustmentAsked && (
            <StepBlock>
              <p className="text-sm font-semibold text-ink">Advisory pidió ajustes a la versión {latest?.version}</p>
              <p className="mx-auto mt-1 max-w-xl text-base text-ink">{adjustmentAsked.adjustmentRequest}</p>
              {adjustmentAsked.observations && (
                <p className="mx-auto mt-1 max-w-xl text-sm text-ink">Observaciones: {adjustmentAsked.observations}</p>
              )}
            </StepBlock>
          )}
          {latest && !showForm && (
            <>
              <ProposalView proposals={proposals} />
              <StepBlock>
                <Button variant="secondary" onClick={() => setWritingNew(true)}>
                  Escribir una versión nueva
                </Button>
              </StepBlock>
            </>
          )}
          {showForm && (
            <ProposalForm
              key={latest?.id ?? "nueva"}
              caseId={caseId}
              base={latest}
              nextVersion={(latest?.version ?? 0) + 1}
              onSaved={changed}
              onCancel={latest && status !== "AJUSTES_PROPUESTA" ? () => setWritingNew(false) : undefined}
            />
          )}
        </StepCard>
      );
    }

    // Advisory revisa la propuesta en diseño
    if (isStaff && status === "PROPUESTA_EN_DISENO") {
      return (
        <StepCard title="Propuesta" subtitle="Revisa la propuesta del consultor antes de enviarla al cliente.">
          {latest ? (
            <>
              <ProposalView proposals={proposals} />
              {adjustmentAsked && (
                <StepBlock>
                  <p className="text-sm text-ink">Ya pediste ajustes a esta versión:</p>
                  <p className="mx-auto mt-1 max-w-xl text-base text-ink">{adjustmentAsked.adjustmentRequest}</p>
                </StepBlock>
              )}
              <ProposalReviewPanel key={latest.id} proposal={latest} onDone={changed} />
            </>
          ) : (
            <StepBlock>
              <p className="text-base text-ink">El consultor todavía no ha guardado una propuesta.</p>
            </StepBlock>
          )}
        </StepCard>
      );
    }

    // Advisory envía la propuesta aprobada
    if (isStaff && status === "PROPUESTA_LISTA_QA" && latest) {
      return (
        <StepCard title="Propuesta" subtitle="La propuesta está aprobada. Envíala al cliente para que decida.">
          <ProposalView proposals={proposals} />
          <SendProposalPanel proposal={latest} onDone={changed} />
        </StepCard>
      );
    }

    // El cliente decide
    if (isContact && (status === "PROPUESTA_ENVIADA" || status === "EN_DECISION_CLIENTE")) {
      return (
        <StepCard title="Decisión" subtitle="Revisa la propuesta de tu consultor y decide cómo seguir.">
          <ProposalView proposals={proposals} defaultOpen />
          <DecisionPanel caseId={caseId} onDone={changed} />
        </StepCard>
      );
    }

    // Cualquier otro rol: solo lectura
    return (
      <StepCard title={stepLabel} subtitle={waiting}>
        <ProposalView proposals={proposals} />
      </StepCard>
    );
  }

  // --- Resto de estados: se explica qué se está esperando ---
  return <StepCard title={stepLabel} subtitle={waiting} />;
}
