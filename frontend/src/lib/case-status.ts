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

/*
 * Los estados se muestran como texto, sin píldora: el verde marca el avance,
 * el negro lo que espera una acción o ya cerró.
 */
const T_GREEN = "font-semibold text-primary";
const T_BLACK = "font-semibold text-ink";

export const STATUS_COLORS: Record<string, string> = {
  CREADO: "font-medium text-ink",
  EN_REVISION: T_BLACK,
  CLASIFICADO: T_GREEN,
  EN_POSTULACION: T_GREEN,
  ASIGNADO: T_GREEN,
  PROPUESTA_EN_DISENO: T_GREEN,
  PROPUESTA_LISTA_QA: T_GREEN,
  PROPUESTA_ENVIADA: T_GREEN,
  EN_DECISION_CLIENTE: T_BLACK,
  AJUSTES_PROPUESTA: T_BLACK,
  PROPUESTA_ACEPTADA: T_GREEN,
  PENDIENTE_CONTRATACION: T_GREEN,
  AUTORIZADO_EJECUCION: T_GREEN,
  EN_EJECUCION: T_GREEN,
  LISTO_PARA_CIERRE: T_GREEN,
  CERRADO: "font-bold text-ink",
  CERRADO_SIN_CONTRATACION: "font-medium text-ink",
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function statusLabel(code: string) {
  return STATUS_LABELS[code] ?? code;
}

export function statusColor(code: string) {
  return STATUS_COLORS[code] ?? "text-ink";
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

/** Avance del caso en el flujo, de 0 a 1 (según el orden de los estados). */
export function statusProgress(code: string) {
  const i = ALL_STATUSES.indexOf(code);
  return i < 0 ? 0 : i / (ALL_STATUSES.length - 1);
}

/** Texto del SLA: lo vencido en negrita y mayúsculas, lo que va en plazo en verde. */
export function slaTone(state?: string) {
  if (state === "VENCIDO") return "font-bold uppercase tracking-wide text-ink";
  if (state === "POR_VENCER") return "font-semibold text-ink";
  if (state === "OK") return "font-semibold text-primary";
  return "";
}
