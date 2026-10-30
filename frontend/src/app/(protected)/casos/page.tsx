"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Briefcase, RefreshCw, Search, SearchX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ALL_STATUSES, statusLabel, statusColor } from "@/lib/case-status";
import { SkeletonRegion, SkeletonTable, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

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

type SortKey = "caseNumber" | "title" | "company" | "urgency" | "status";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "caseNumber", label: "# Caso" },
  { key: "title", label: "Título" },
  { key: "company", label: "Empresa" },
  { key: "urgency", label: "Urgencia" },
  { key: "status", label: "Estado" },
];

function sortValue(c: CaseListItem, key: SortKey): string {
  switch (key) {
    case "caseNumber":
      return c.caseNumber;
    case "title":
      return c.title;
    case "company":
      return c.company?.name ?? "";
    case "urgency":
      return c.urgency?.label ?? "";
    case "status":
      return statusLabel(c.status);
  }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Casos</h1>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="mt-6">
        <SkeletonTable />
      </div>
    </SkeletonRegion>
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  // El filtro de estado vive en la URL: se puede compartir y funciona desde el Dashboard.
  const filter = searchParams.get("estado") ?? "TODOS";

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "TODOS") params.delete("estado");
    else params.set("estado", value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

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
    const q = query.trim().toLowerCase();
    let list = cases.filter((c) => {
      if (filter !== "TODOS" && c.status !== filter) return false;
      if (!q) return true;
      return [c.caseNumber, c.title, c.company?.name ?? ""].some((v) => v.toLowerCase().includes(q));
    });
    if (sort) {
      const factor = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort(
        (a, b) => factor * sortValue(a, sort.key).localeCompare(sortValue(b, sort.key), "es", { numeric: true })
      );
    }
    return list;
  }, [cases, filter, query, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function clearFilters() {
    setQuery("");
    setFilter("TODOS");
  }

  if (error && !cases) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Casos</h1>
        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!cases || !visibleCases) return <CasosSkeleton />;

  const hasFilters = filter !== "TODOS" || query.trim() !== "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Casos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Buscar casos</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por número, título o empresa"
              className="w-72 rounded-md border border-line-strong bg-surface py-1.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink"
          >
            <option value="TODOS">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            onClick={() => load(true)}
            loading={refreshing}
            aria-label="Actualizar lista"
          >
            {!refreshing && <RefreshCw className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>

      {cases.length > 0 && (
        <p aria-live="polite" className="mt-3 text-sm text-ink-muted">
          {hasFilters
            ? `${visibleCases.length} de ${cases.length} casos`
            : `${cases.length} ${cases.length === 1 ? "caso" : "casos"}`}
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="ml-3 font-medium text-primary hover:underline">
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
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-strong"
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
            description="Prueba con otro término o quita el filtro de estado."
          >
            <Button variant="secondary" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </EmptyState>
        </div>
      )}

      {visibleCases.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunken text-ink-soft">
              <tr>
                {COLUMNS.map(({ key, label }) => {
                  const active = sort?.key === key;
                  return (
                    <th
                      key={key}
                      scope="col"
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                      className="px-4 py-3 font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        {label}
                        {active &&
                          (sort.dir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          ))}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-surface">
              {visibleCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/casos/${c.id}`)}
                  className="cursor-pointer border-t border-line hover:bg-sunken"
                >
                  <td className="px-4 py-3">
                    <Link href={`/casos/${c.id}`} className="font-medium text-ink hover:underline">
                      {c.caseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.title}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.company?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.urgency?.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
