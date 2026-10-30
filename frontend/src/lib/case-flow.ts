/**
 * Recorrido del caso: las 7 etapas que ve cualquier rol en el detalle.
 * Es distinto de STAGES (que agrupa para el Dashboard): aquí la propuesta enviada
 * ya es turno del cliente, así que cuenta como "Decisión".
 */
export const FLOW_STEPS = [
  { key: "REVISION", label: "Revisión", statuses: ["CREADO", "EN_REVISION", "CLASIFICADO"] },
  { key: "POSTULACION", label: "Postulación", statuses: ["EN_POSTULACION", "ASIGNADO"] },
  { key: "PROPUESTA", label: "Propuesta", statuses: ["PROPUESTA_EN_DISENO", "PROPUESTA_LISTA_QA", "AJUSTES_PROPUESTA"] },
  { key: "DECISION", label: "Decisión", statuses: ["PROPUESTA_ENVIADA", "EN_DECISION_CLIENTE", "PROPUESTA_ACEPTADA"] },
  { key: "CONTRATACION", label: "Contratación", statuses: ["PENDIENTE_CONTRATACION", "AUTORIZADO_EJECUCION"] },
  { key: "EJECUCION", label: "Ejecución", statuses: ["EN_EJECUCION", "LISTO_PARA_CIERRE"] },
  { key: "CIERRE", label: "Cierre", statuses: ["CERRADO", "CERRADO_SIN_CONTRATACION"] },
] as const;

export type FlowStepState = "done" | "current" | "todo";

/** Estado de cada etapa según el estado del caso. */
export function flowStates(status: string): FlowStepState[] {
  const idx = FLOW_STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
  if (idx < 0) return FLOW_STEPS.map(() => "todo");
  // Un caso cerrado con contrato terminó todo el recorrido; el que se cierra sin contratación se queda en Decisión.
  if (status === "CERRADO") return FLOW_STEPS.map(() => "done");
  if (status === "CERRADO_SIN_CONTRATACION") {
    return FLOW_STEPS.map((_, i) => (i < 3 ? "done" : i === 3 ? "done" : "todo"));
  }
  return FLOW_STEPS.map((_, i) => (i < idx ? "done" : i === idx ? "current" : "todo"));
}

export function flowStepIndex(status: string) {
  return FLOW_STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
}

/** Qué pasa en cada estado cuando el usuario no tiene una acción propia en ese paso. */
export const STATUS_WAITING: Record<string, string> = {
  CREADO: "Advisory revisará el caso en cuanto entre a su bandeja.",
  EN_REVISION: "Advisory está revisando y clasificando el caso.",
  CLASIFICADO: "El caso está clasificado y se publicará para que los consultores se postulen.",
  EN_POSTULACION: "Los consultores se están postulando; Advisory asignará a uno.",
  ASIGNADO: "El consultor asignado prepara la propuesta.",
  PROPUESTA_EN_DISENO: "El consultor diseña la propuesta y Advisory la revisa.",
  PROPUESTA_LISTA_QA: "La propuesta pasó la revisión de calidad y Advisory la enviará al cliente.",
  AJUSTES_PROPUESTA: "El consultor ajusta la propuesta según lo que pidió Advisory.",
  PROPUESTA_ENVIADA: "La propuesta ya está con el cliente, que debe decidir.",
  EN_DECISION_CLIENTE: "El cliente está decidiendo sobre la propuesta.",
  PROPUESTA_ACEPTADA: "El cliente aceptó la propuesta y el caso pasa a la contratación.",
  PENDIENTE_CONTRATACION: "Se está completando el checklist de contratación.",
  AUTORIZADO_EJECUCION: "La ejecución está autorizada y está por comenzar.",
  EN_EJECUCION: "El consultor está ejecutando el trabajo.",
  LISTO_PARA_CIERRE: "El trabajo terminó y el caso está listo para cerrarse.",
  CERRADO: "El caso terminó.",
  CERRADO_SIN_CONTRATACION: "El cliente decidió no continuar y el caso se cerró.",
};
