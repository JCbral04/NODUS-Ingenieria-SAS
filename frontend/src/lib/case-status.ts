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
  CREADO: "bg-blue-900/40 text-blue-300",
  EN_REVISION: "bg-amber-900/40 text-amber-300",
  CLASIFICADO: "bg-indigo-900/40 text-indigo-300",
  EN_POSTULACION: "bg-indigo-900/40 text-indigo-300",
  ASIGNADO: "bg-indigo-900/40 text-indigo-300",
  PROPUESTA_EN_DISENO: "bg-purple-900/40 text-purple-300",
  PROPUESTA_LISTA_QA: "bg-purple-900/40 text-purple-300",
  PROPUESTA_ENVIADA: "bg-purple-900/40 text-purple-300",
  EN_DECISION_CLIENTE: "bg-amber-900/40 text-amber-300",
  AJUSTES_PROPUESTA: "bg-amber-900/40 text-amber-300",
  PROPUESTA_ACEPTADA: "bg-emerald-900/40 text-emerald-300",
  PENDIENTE_CONTRATACION: "bg-emerald-900/40 text-emerald-300",
  AUTORIZADO_EJECUCION: "bg-emerald-900/40 text-emerald-300",
  EN_EJECUCION: "bg-emerald-900/40 text-emerald-300",
  LISTO_PARA_CIERRE: "bg-emerald-900/40 text-emerald-300",
  CERRADO: "bg-green-900/40 text-green-300",
  CERRADO_SIN_CONTRATACION: "bg-red-900/40 text-red-300",
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function statusLabel(code: string) {
  return STATUS_LABELS[code] ?? code;
}

export function statusColor(code: string) {
  return STATUS_COLORS[code] ?? "bg-slate-800 text-slate-300";
}