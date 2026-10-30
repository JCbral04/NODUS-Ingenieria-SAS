export interface ConsultantProfile {
  id: number;
  levelCode: string | null;
  modality: string;
  sponsorName: string | null;
  status: string;
  availability: boolean;
  bio: string | null;
  experienceYears: number;
  user: { id: number; email: string; fullName: string; status: string };
  specialty: { id: number; code: string; label: string } | null;
}

export const CONSULTANT_STATUS_LABELS: Record<string, string> = {
  REGISTRADO: "Registrado",
  EN_VALIDACION: "En validación",
  HABILITADO: "Habilitado",
  CONDICIONADO: "Condicionado",
  SUSPENDIDO: "Suspendido",
  INACTIVO: "Inactivo",
};

export function consultantStatusLabel(code: string) {
  return CONSULTANT_STATUS_LABELS[code] ?? code;
}

/** Estado como texto: verde = puede tomar casos, negro = pendiente, negro en mayúsculas = bloqueado. */
export function consultantStatusTone(code: string) {
  if (code === "HABILITADO") return "font-semibold text-primary";
  if (code === "SUSPENDIDO") return "font-bold uppercase tracking-wide text-ink";
  if (code === "INACTIVO") return "font-medium text-ink";
  return "font-semibold text-ink";
}

/** Cambios de estado permitidos (espejo de las reglas del backend). */
export const CONSULTANT_TRANSITIONS: Record<string, string[]> = {
  REGISTRADO: ["EN_VALIDACION", "INACTIVO"],
  EN_VALIDACION: ["HABILITADO", "CONDICIONADO", "SUSPENDIDO", "INACTIVO"],
  HABILITADO: ["CONDICIONADO", "SUSPENDIDO", "INACTIVO"],
  CONDICIONADO: ["HABILITADO", "SUSPENDIDO", "INACTIVO"],
  SUSPENDIDO: ["HABILITADO", "INACTIVO"],
  INACTIVO: [],
};

const LEVEL_LABELS: Record<string, string> = {
  VALIDADO: "Validado",
  HABILITADO: "Habilitado",
  PREMIUM: "Premium",
  ESTRATEGICO: "Estratégico",
};

export function levelLabel(code: string | null) {
  return code ? (LEVEL_LABELS[code] ?? code) : "Sin nivel";
}

const MODALITY_LABELS: Record<string, string> = {
  INDEPENDIENTE: "Independiente",
  SPONSOR: "Con sponsor",
  PROPIO: "Equipo propio",
};

export function modalityLabel(code: string) {
  return MODALITY_LABELS[code] ?? code;
}

export function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
