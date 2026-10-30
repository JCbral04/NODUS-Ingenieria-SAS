export const STATUS_LABELS: Record<string, string> = {
  CREADO: "Creado",
  EN_REVISION: "En revisión",
  CLASIFICADO: "Clasificado",
  EN_POSTULACION: "En postulación",
  ASIGNADO: "Asignado",
  PROPUESTA_EN_DISENO: "Propuesta en diseño",
  PROPUESTA_LISTA_QA: "Propuesta lista (QA)",
  PROPUESTA_ENVIADA: "Propuesta enviada",
  EN_DECISION_CLIENTE: "En decisión del cliente",
  AJUSTES_PROPUESTA: "Ajustes de propuesta",
  PROPUESTA_ACEPTADA: "Propuesta aceptada",
  PENDIENTE_CONTRATACION: "Pendiente de contratación",
  AUTORIZADO_EJECUCION: "Autorizado para ejecución",
  EN_EJECUCION: "En ejecución",
  LISTO_PARA_CIERRE: "Listo para cierre",
  CERRADO: "Cerrado",
  CERRADO_SIN_CONTRATACION: "Cerrado sin contratación",
};

export const STATUS_COLORS: Record<string, string> = {
  CREADO: "bg-info-soft text-info",
  EN_REVISION: "bg-warn-soft text-warn",
  CLASIFICADO: "bg-flow-soft text-flow",
  EN_POSTULACION: "bg-flow-soft text-flow",
  ASIGNADO: "bg-flow-soft text-flow",
  PROPUESTA_EN_DISENO: "bg-prop-soft text-prop",
  PROPUESTA_LISTA_QA: "bg-prop-soft text-prop",
  PROPUESTA_ENVIADA: "bg-prop-soft text-prop",
  EN_DECISION_CLIENTE: "bg-warn-soft text-warn",
  AJUSTES_PROPUESTA: "bg-warn-soft text-warn",
  PROPUESTA_ACEPTADA: "bg-ok-soft text-ok",
  PENDIENTE_CONTRATACION: "bg-ok-soft text-ok",
  AUTORIZADO_EJECUCION: "bg-ok-soft text-ok",
  EN_EJECUCION: "bg-ok-soft text-ok",
  LISTO_PARA_CIERRE: "bg-ok-soft text-ok",
  CERRADO: "bg-ok-soft text-ok",
  CERRADO_SIN_CONTRATACION: "bg-danger-soft text-danger",
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function statusLabel(code: string) {
  return STATUS_LABELS[code] ?? code;
}

export function statusColor(code: string) {
  return STATUS_COLORS[code] ?? "bg-sunken text-ink-soft";
}
const SLA_LABELS: Record<string, string> = {
  OK: "En plazo",
  POR_VENCER: "Por vencer",
  VENCIDO: "Vencido",
};

export function slaLabel(state: string) {
  return SLA_LABELS[state] ?? state;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ADVISORY: "Advisory",
  CONSULTOR: "Consultor",
  MIPYME: "Mipyme",
};

export function roleLabel(role?: string) {
  return role ? (ROLE_LABELS[role] ?? role) : "";
}
