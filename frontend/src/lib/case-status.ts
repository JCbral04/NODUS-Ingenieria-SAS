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
  CREADO: "bg-info-soft text-ink",
  EN_REVISION: "border border-ink bg-surface text-ink",
  CLASIFICADO: "bg-flow-soft text-ink",
  EN_POSTULACION: "bg-flow-soft text-ink",
  ASIGNADO: "bg-flow-soft text-ink",
  PROPUESTA_EN_DISENO: "bg-prop-soft text-ink",
  PROPUESTA_LISTA_QA: "bg-prop-soft text-ink",
  PROPUESTA_ENVIADA: "bg-prop-soft text-ink",
  EN_DECISION_CLIENTE: "border border-ink bg-surface text-ink",
  AJUSTES_PROPUESTA: "border border-ink bg-surface text-ink",
  PROPUESTA_ACEPTADA: "bg-primary text-white",
  PENDIENTE_CONTRATACION: "bg-primary text-white",
  AUTORIZADO_EJECUCION: "bg-primary text-white",
  EN_EJECUCION: "bg-primary text-white",
  LISTO_PARA_CIERRE: "bg-primary text-white",
  CERRADO: "bg-ink text-white",
  CERRADO_SIN_CONTRATACION: "border border-ink bg-info-soft text-ink",
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
