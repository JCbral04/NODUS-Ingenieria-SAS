"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, RefreshCw, Search, SearchX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { stageOf, statusColor, statusLabel } from "@/lib/case-status";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { UrgencyBars } from "@/components/ui/UrgencyBars";
import { useToast } from "@/components/ui/Toast";
import { normalize } from "@/lib/utils";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  company: { name: string } | null;
  urgency: { label: string } | null;
}

interface CompanySummary {
  name: string;
  open: number;
  closed: number;
  /** Urgencia más alta entre los casos en curso. */
  urgency: string | null;
  cases: CaseListItem[];
}

const URGENCY_RANK: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };

function summarize(cases: CaseListItem[]): CompanySummary[] {
  const map = new Map<string, CompanySummary>();
  for (const c of cases) {
    const name = c.company?.name ?? "Sin empresa";
    const s = map.get(name) ?? { name, open: 0, closed: 0, urgency: null, cases: [] };
    s.cases.push(c);
    if (stageOf(c.status) === "CIERRE") s.closed += 1;
    else {
      s.open += 1;
      const u = c.urgency?.label;
      if (u && (URGENCY_RANK[u] ?? 0) > (URGENCY_RANK[s.urgency ?? ""] ?? 0)) s.urgency = u;
    }
    map.set(name, s);
  }
  // Primero las empresas con más urgencia y más casos en curso.
  return [...map.values()].sort(
    (a, b) =>
      (URGENCY_RANK[b.urgency ?? ""] ?? 0) - (URGENCY_RANK[a.urgency ?? ""] ?? 0) ||
      b.open - a.open ||
      a.name.localeCompare(b.name, "es"),
  );
}

export default function EmpresasPage() {
  const toast = useToast();
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [openNames, setOpenNames] = useState<Set<string>>(new Set());
  const [firstOpened, setFirstOpened] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      setError(null);
      try {
        setCases(await apiFetch<CaseListItem[]>("/api/cases"));
        if (manual) toast.success("Lista de empresas actualizada.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar empresas";
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

  const companies = useMemo(() => (cases ? summarize(cases) : null), [cases]);

  // La primera empresa (la que más atención pide) arranca desplegada.
  useEffect(() => {
    if (companies && companies.length > 0 && !firstOpened) {
      setOpenNames(new Set([companies[0].name]));
      setFirstOpened(true);
    }
  }, [companies, firstOpened]);

  const visible = useMemo(() => {
    if (!companies) return null;
    const q = normalize(query.trim());
    return q ? companies.filter((c) => normalize(c.name).includes(q)) : companies;
  }, [companies, query]);

  function toggle(name: string) {
    setOpenNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (error && !cases) {
    return (
      <div>
        <PageHeader title="Empresas" />
        <p role="alert" className="mt-6 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!companies || !visible) {
    return (
      <SkeletonRegion label="Cargando empresas">
        <PageHeader title="Empresas" />
        <div className="card mt-8 divide-y divide-line">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  return (
    <div>
      <PageHeader
        title="Empresas"
        actions={
          <Button variant="inverse" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      {companies.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Building2}
            title="Todavía no hay empresas"
            description="Cada empresa aparece aquí cuando registra su primer caso."
          />
        </div>
      ) : (
        <>
          <label className="relative mt-8 block w-full sm:w-80">
            <span className="sr-only">Buscar empresa</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa"
              className="w-full rounded-full border border-line-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/40"
            />
          </label>

          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="Ninguna empresa coincide con tu búsqueda"
                description="Prueba con otro nombre."
              />
            </div>
          ) : (
            <ul className="card mt-5 divide-y divide-line overflow-hidden">
              {visible.map((c) => {
                const isOpen = openNames.has(c.name);
                const panelId = `empresa-${c.name.replace(/\W+/g, "-")}`;
                return (
                  <li key={c.name}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(c.name)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-sunken"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold text-ink">{c.name}</span>
                        <span className="block text-sm text-ink">
                          {c.open} en curso · {c.closed} {c.closed === 1 ? "cerrado" : "cerrados"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-4 text-sm font-semibold text-ink">
                        {c.urgency && (
                          <span className="inline-flex items-center gap-2">
                            <UrgencyBars level={c.urgency} />
                            {c.urgency}
                          </span>
                        )}
                        <ChevronDown
                          aria-hidden
                          className={`h-5 w-5 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>

                    {isOpen && (
                      <div id={panelId} className="border-t border-line bg-surface px-5 pb-4 pt-2">
                        <ul className="divide-y divide-line">
                          {c.cases.map((k) => (
                            <li key={k.id}>
                              <Link
                                href={`/casos/${k.id}`}
                                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-md px-1 py-2.5 hover:bg-sunken"
                              >
                                <span className="min-w-0 text-base text-ink">
                                  <span className="font-semibold">{k.caseNumber}</span> · {k.title}
                                </span>
                                <span className={`text-sm ${statusColor(k.status)}`}>{statusLabel(k.status)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={`/casos?q=${encodeURIComponent(c.name)}`}
                          className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
                        >
                          Ver en Casos
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
