"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, RefreshCw, Upload } from "lucide-react";
import { apiDownload, apiFetch, apiUpload } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  company: { name: string } | null;
}

interface DocumentItem {
  id: number;
  caseId: number;
  stage: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  version: number;
  createdAt: string;
  uploadedBy: { id: number; fullName: string; email: string } | null;
}

/** Etapas de un documento (las mismas que valida el backend). */
const DOC_STAGES = [
  { code: "INTAKE", label: "Intake" },
  { code: "EVALUACION", label: "Evaluación" },
  { code: "POSTULACION", label: "Postulación" },
  { code: "PROPUESTA", label: "Propuesta" },
  { code: "CONTRATACION", label: "Contratación" },
  { code: "EJECUCION", label: "Ejecución" },
  { code: "CIERRE", label: "Cierre" },
];

// Mismos tipos y tope que acepta el backend.
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
};
const MAX_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE = 8;

function stageLabel(code: string) {
  return DOC_STAGES.find((s) => s.code === code)?.label ?? code;
}

function formatSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `hace ${hours} h`;
  if (hours < 48) return "ayer";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) return "Solo se aceptan PDF, Word, Excel o imágenes PNG y JPG.";
  if (file.size > MAX_BYTES) return "El archivo supera los 10 MB.";
  return null;
}

export default function DocumentosPage() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [caseId, setCaseId] = useState("");
  const [stage, setStage] = useState("INTAKE");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      setError(null);
      try {
        const list = await apiFetch<CaseListItem[]>("/api/cases");
        const perCase = await Promise.all(
          list.map((c) => apiFetch<DocumentItem[]>(`/api/cases/${c.id}/documents`).catch(() => [] as DocumentItem[])),
        );
        setCases(list);
        setDocs(perCase.flat());
        if (manual) toast.success("Documentos actualizados.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar los documentos";
        setError(message);
        if (manual) toast.error(message);
      } finally {
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    load();
  }, []);

  const caseById = useMemo(() => new Map((cases ?? []).map((c) => [c.id, c])), [cases]);
  const recent = useMemo(
    () => [...docs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [docs],
  );

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    const problem = validateFile(f);
    setFileError(problem);
    setFile(problem ? null : f);
  }

  async function handleUpload() {
    if (!file || !caseId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("stage", stage);
      form.append("file", file);
      await apiUpload(`/api/cases/${caseId}/documents`, form);
      toast.success(`"${file.name}" quedó guardado en ${stageLabel(stage)}.`);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      // Solo se vuelve a pedir la lista del caso que cambió.
      const fresh = await apiFetch<DocumentItem[]>(`/api/cases/${caseId}/documents`);
      setDocs((prev) => [...prev.filter((d) => d.caseId !== Number(caseId)), ...fresh]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(d: DocumentItem) {
    setDownloadingId(d.id);
    try {
      await apiDownload(`/api/documents/${d.id}/download`, d.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descargar el archivo");
    } finally {
      setDownloadingId(null);
    }
  }

  if (error && !cases) {
    return (
      <div>
        <PageHeader title="Documentos" />
        <p role="alert" className="mt-6 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!cases) {
    return (
      <SkeletonRegion label="Cargando documentos">
        <PageHeader title="Documentos" />
        <Skeleton className="mt-8 h-72 w-full rounded-3xl" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  const canUpload = Boolean(file && caseId) && !uploading;

  return (
    <div>
      <PageHeader
        title="Documentos"
        actions={
          <Button variant="inverse" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      {cases.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FileText}
            title="Todavía no hay casos para guardar documentos"
            description="Los documentos se guardan dentro de un caso. Cuando haya uno, podrás subir archivos desde aquí."
          />
        </div>
      ) : (
        <>
          <section
            aria-label="Subir un documento"
            className="mt-8 rounded-3xl border-2 border-dashed border-ink bg-surface p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="label-line">Caso</span>
                <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input-line">
                  <option value="">Elige un caso</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} · {c.company?.name ?? c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label-line">Etapa</span>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="input-line">
                  {DOC_STAGES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "mt-6 rounded-2xl bg-canvas px-4 py-8 text-center transition-colors",
                dragging && "bg-primary-soft",
              )}
            >
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                className="sr-only"
                tabIndex={-1}
                aria-label="Archivo a subir"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <>
                  <p className="text-lg font-bold text-ink">{file.name}</p>
                  <p className="mt-1 text-sm text-ink">
                    {ALLOWED_TYPES[file.type]} · {formatSize(file.size)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-ink">Arrastra el archivo aquí</p>
                  <p className="mt-1 text-sm text-ink">PDF, Word, Excel o imágenes PNG y JPG · máximo 10 MB</p>
                </>
              )}
              {fileError && (
                <p role="alert" className="mx-auto mt-3 max-w-md rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-left text-sm text-ink">
                  {fileError}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button variant={file ? "secondary" : "primary"} onClick={() => fileInput.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden />
                  {file ? "Cambiar archivo" : "Elegir archivo"}
                </Button>
                {file && (
                  <Button
                    onClick={handleUpload}
                    disabled={!canUpload}
                    loading={uploading}
                    loadingText="Subiendo…"
                  >
                    Subir documento
                  </Button>
                )}
              </div>
              {file && !caseId && <p className="mt-3 text-sm font-semibold text-ink">Elige primero el caso.</p>}
            </div>
          </section>

          <section aria-label="Actividad reciente" className="mt-10">
            <h2 className="text-2xl font-semibold text-ink">Actividad reciente</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-ink">Todavía no se ha subido ningún documento.</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {recent.slice(0, visibleCount).map((d) => {
                    const c = caseById.get(d.caseId);
                    return (
                      <li key={d.id} className="flex items-start gap-4 py-4">
                        <span aria-hidden className="mt-2 h-3 w-3 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-base text-ink">
                            <span className="font-semibold">{d.uploadedBy?.fullName ?? "Alguien"}</span> subió{" "}
                            <span className="font-semibold">{d.name}</span>{" "}
                            <span className="text-sm">v{d.version}</span>
                          </p>
                          <p className="text-sm text-ink">
                            {c?.caseNumber ?? `Caso ${d.caseId}`} · {stageLabel(d.stage)}
                            {d.sizeBytes !== null && ` · ${formatSize(d.sizeBytes)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-sm text-ink sm:flex-row sm:items-center sm:gap-5">
                          <span>{relativeTime(d.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleDownload(d)}
                            disabled={downloadingId === d.id}
                            className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 disabled:opacity-50"
                          >
                            <Download className="h-4 w-4" aria-hidden />
                            {downloadingId === d.id ? "Descargando…" : "Descargar"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {recent.length > visibleCount && (
                  <Button variant="secondary" className="mt-4" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                    Mostrar más
                  </Button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
