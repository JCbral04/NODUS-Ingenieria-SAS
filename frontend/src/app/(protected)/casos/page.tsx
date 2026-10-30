"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, RefreshCw, Search, SearchX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ALL_STATUSES, stageLabel, stageOf, statusLabel, statusColor, statusProgress } from "@/lib/case-status";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { UrgencyBars } from "@/components/ui/UrgencyBars";
import { normalize } from "@/lib/utils";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  createdAt: string;
  company: { name: string };
  urgency: { label: string } | null;
  impact: { label: string } | null;
}

/** Secciones en el orden en que hay que atenderlas. */
const URGENCY_GROUPS = [
  { key: "Alta", title: "Urgencia alta", hint: "Atender primero" },
  { key: "Media", title: "Urgencia media", hint: "Esta semana" },
  { key: "Baja", title: "Urgencia baja", hint: "Sin prisa" },
  { key: "", title: "Sin urgencia definida", hint: "Falta clasificar" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function CasosPage() {
  // useSearchParams exige Suspense en el build de Next.
  return (
    <Suspense fallback={<CasosSkeleton />}>
      <CasosContent />
    </Suspense>
  );
}

function CasosSkeleton() {
  return (
    <SkeletonRegion label="Cargando casos">
      <PageHeader title="Casos" actions={<Skeleton className="h-10 w-48 rounded-full" />} />
      <Skeleton className="mt-8 h-6 w-44" />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-6 w-4/5" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-6 h-2 w-full" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

function CaseCard({ c }: { c: CaseListItem }) {
  const progress = Math.round(statusProgress(c.status) * 100);
  return (
    <Link
      href={`/casos/${c.id}`}
      className="card card-hover flex flex-col p-5 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">{c.caseNumber}</span>
        <span className={`text-right text-sm ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-ink">{c.title}</h3>
      <p className="mt-1 text-sm text-ink">{c.company?.name ?? "—"}</p>

      <div
        role="progressbar"
        aria-label="Avance del caso"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(progress, 4)}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-ink">
        <span className="inline-flex items-center gap-2 font-semibold">
          <UrgencyBars level={c.urgency?.label} />
          {c.urgency?.label ?? "Sin urgencia"}
        </span>
        <span>{formatDate(c.createdAt)}</span>
      </div>
    </Link>
  );
}

function CasosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Los filtros viven en la URL: se pueden compartir y funcionan desde el Dashboard.
  const filter = searchParams.get("estado") ?? "TODOS";
  const etapa = searchParams.get("etapa");
  const urgencia = searchParams.get("urgencia") ?? "TODAS";

  function setParam(name: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "TODOS" || value === "TODAS") params.delete(name);
    else params.set(name, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const setFilter = (value: string) => setParam("estado", value);

  const load = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      setError(null);
      try {
        setCases(await apiFetch<CaseListItem[]>("/api/cases"));
        if (manual) toast.success("Lista de casos actualizada.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar casos";
        setError(message);
        if (manual) toast.error(message);
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, []);

  const visibleCases = useMemo(() => {
    if (!cases) return null;
    const q = normalize(query.trim());
    return cases.filter((c) => {
      if (filter !== "TODOS" && c.status !== filter) return false;
      if (etapa && stageOf(c.status) !== etapa) return false;
      if (urgencia !== "TODAS") {
        const label = c.urgency?.label;
        const known = label === "Alta" || label === "Media" || label === "Baja";
        if (urgencia === "sin" ? known : label !== urgencia) return false;
      }
      if (!q) return true;
      return [c.caseNumber, c.title, c.company?.name ?? ""].some((v) => normalize(v).includes(q));
    });
  }, [cases, filter, etapa, urgencia, query]);

  const groups = useMemo(() => {
    if (!visibleCases) return [];
    const known = URGENCY_GROUPS.filter((g) => g.key).map((g) => g.key);
    return URGENCY_GROUPS.map((g) => ({
      ...g,
      items: visibleCases.filter((c) =>
        g.key ? c.urgency?.label === g.key : !c.urgency || !known.includes(c.urgency.label),
      ),
    })).filter((g) => g.items.length > 0);
  }, [visibleCases]);

  function clearFilters() {
    setQuery("");
    router.replace(pathname);
  }

  if (error && !cases) {
    return (
      <div>
        <PageHeader title="Casos" />
        <p role="alert" className="mt-4 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!cases || !visibleCases) return <CasosSkeleton />;

  const hasFilters = filter !== "TODOS" || etapa !== null || urgencia !== "TODAS" || query.trim() !== "";

  return (
    <div>
      <PageHeader title="Casos" description="Clasificados por urgencia, de lo más urgente a lo menos." />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-auto">
          <span className="sr-only">Buscar casos</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, título o empresa"
            className="w-full rounded-full border border-line-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/40 sm:w-80"
          />
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrar por estado"
          className="rounded-full border border-line-strong bg-surface px-4 py-2 text-sm text-ink"
        >
          <option value="TODOS">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={urgencia}
          onChange={(e) => setParam("urgencia", e.target.value)}
          aria-label="Filtrar por urgencia"
          className="rounded-full border border-line-strong bg-surface px-4 py-2 text-sm text-ink"
        >
          <option value="TODAS">Todas las urgencias</option>
          <option value="Alta">Urgencia alta</option>
          <option value="Media">Urgencia media</option>
          <option value="Baja">Urgencia baja</option>
          <option value="sin">Sin urgencia</option>
        </select>
        <Button variant="secondary" className="px-3 py-2" onClick={() => load(true)} loading={refreshing} aria-label="Actualizar lista">
          {!refreshing && <RefreshCw className="h-4 w-4" aria-hidden />}
        </Button>
      </div>

      {cases.length > 0 && (
        <p aria-live="polite" className="mt-4 text-sm text-ink-muted">
          {hasFilters
            ? `${visibleCases.length} de ${cases.length} casos`
            : `${cases.length} ${cases.length === 1 ? "caso" : "casos"}`}
          {etapa && (
            <span className="ml-3 font-semibold">
              Etapa: {stageLabel(etapa)}
              <button
                type="button"
                onClick={() => setParam("etapa", null)}
                aria-label={`Quitar el filtro de etapa ${stageLabel(etapa)}`}
                className="ml-1.5 underline underline-offset-4"
              >
                quitar
              </button>
            </span>
          )}
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="ml-3 font-semibold text-ink underline underline-offset-4">
              Limpiar filtros
            </button>
          )}
        </p>
      )}

      {cases.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Briefcase}
            title="Todavía no hay casos registrados"
            description="Los casos aparecen aquí apenas una empresa los registra. Puedes crear el primero tú mismo."
          >
            <Link
              href="/registro-caso"
              className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:bg-primary-strong"
            >
              Registrar un caso
            </Link>
          </EmptyState>
        </div>
      )}

      {cases.length > 0 && visibleCases.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={SearchX}
            title="Ningún caso coincide con tu búsqueda"
            description="Prueba con otro término o quita los filtros."
          >
            <Button variant="secondary" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </EmptyState>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key || "sin"} aria-label={g.title} className="mt-8">
          <div className="flex items-center gap-3">
            <UrgencyBars level={g.key} />
            <h2 className="text-2xl font-semibold text-ink">
              {g.title} <span className="text-ink-muted">({g.items.length})</span>
            </h2>
            <span className="hidden text-sm text-ink sm:inline">{g.hint}</span>
            <span aria-hidden className="h-px flex-1 bg-line-strong" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {g.items.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
