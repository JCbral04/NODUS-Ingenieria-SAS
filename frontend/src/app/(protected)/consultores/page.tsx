"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, RefreshCw, Search, SearchX, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  consultantStatusLabel,
  consultantStatusTone,
  initials,
  levelLabel,
  modalityLabel,
  type ConsultantProfile,
} from "@/lib/consultant";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { ConsultantStatusButtons } from "@/components/consultores/StatusButtons";
import { normalize } from "@/lib/utils";

/** Secciones por estado de validación, en el orden en que importan. */
const GROUPS = [
  { key: "habilitados", title: "Habilitados", hint: "Pueden tomar casos", statuses: ["HABILITADO"], showStatus: false },
  {
    key: "validacion",
    title: "En validación",
    hint: "Falta decidir si entran",
    statuses: ["EN_VALIDACION", "REGISTRADO", "CONDICIONADO"],
    showStatus: true,
  },
  {
    key: "bloqueados",
    title: "Suspendidos e inactivos",
    hint: "No toman casos",
    statuses: ["SUSPENDIDO", "INACTIVO"],
    showStatus: true,
  },
];

function ConsultoresSkeleton() {
  return (
    <SkeletonRegion label="Cargando consultores">
      <PageHeader title="Consultores" description={<Skeleton className="h-4 w-64" />} />
      <div className="card mt-8 divide-y divide-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-5">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

function ConsultantRow({
  c,
  open,
  showStatus,
  onToggle,
  onChanged,
}: {
  c: ConsultantProfile;
  open: boolean;
  showStatus: boolean;
  onToggle: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const panelId = `consultor-${c.id}`;
  const details: [string, string][] = [
    ["Correo", c.user.email],
    ["Nivel", levelLabel(c.levelCode)],
    ["Modalidad", c.sponsorName ? `${modalityLabel(c.modality)} · ${c.sponsorName}` : modalityLabel(c.modality)],
    ["Experiencia", `${c.experienceYears} ${c.experienceYears === 1 ? "año" : "años"}`],
  ];
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-sunken"
      >
        <span className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
          >
            {initials(c.user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold text-ink">{c.user.fullName}</span>
            <span className="block truncate text-sm text-ink">
              {c.specialty?.label ?? "Sin especialidad"} · {levelLabel(c.levelCode)}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4 text-sm sm:gap-6">
          <span className={c.availability ? "font-semibold text-primary" : "font-medium text-ink"}>
            {c.availability ? "Disponible" : "No disponible"}
          </span>
          {showStatus && (
            <span className={`hidden sm:inline ${consultantStatusTone(c.status)}`}>
              {consultantStatusLabel(c.status)}
            </span>
          )}
          <ChevronDown
            aria-hidden
            className={`h-5 w-5 text-ink transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-5 pb-4 pt-3">
          {showStatus && (
            <p className={`mb-3 text-sm sm:hidden ${consultantStatusTone(c.status)}`}>
              {consultantStatusLabel(c.status)}
            </p>
          )}
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {details.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-ink">{k}</dt>
                <dd className="mt-0.5 truncate font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ConsultantStatusButtons consultant={c} onChanged={onChanged} label="Pasar a:" />
            <Link
              href={`/consultores/${c.id}`}
              className="text-sm font-semibold text-ink underline underline-offset-4"
            >
              Ver perfil completo
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

export default function ConsultoresPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canView = user?.role === "ADVISORY" || user?.role === "ADMIN";

  const [list, setList] = useState<ConsultantProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const load = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      setError(null);
      try {
        setList(await apiFetch<ConsultantProfile[]>("/api/consultants"));
        if (manual) toast.success("Lista de consultores actualizada.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar consultores";
        setError(message);
        if (manual) toast.error(message);
      } finally {
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (canView) load();
    // Solo al montar (o cuando se conoce el rol): el refresco posterior es manual.
  }, [canView]);

  const visible = useMemo(() => {
    if (!list) return null;
    const q = normalize(query.trim());
    return list.filter((c) => {
      if (onlyAvailable && !c.availability) return false;
      if (!q) return true;
      return [c.user.fullName, c.user.email, c.specialty?.label ?? ""].some((v) => normalize(v).includes(q));
    });
  }, [list, query, onlyAvailable]);

  const groups = useMemo(() => {
    if (!visible) return [];
    return GROUPS.map((g) => ({
      ...g,
      items: visible
        .filter((c) => g.statuses.includes(c.status))
        .sort((a, b) => g.statuses.indexOf(a.status) - g.statuses.indexOf(b.status) || a.user.fullName.localeCompare(b.user.fullName, "es")),
    })).filter((g) => g.items.length > 0);
  }, [visible]);

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!user) return <ConsultoresSkeleton />;

  if (!canView) {
    return (
      <div>
        <PageHeader title="Consultores" />
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="El directorio es solo para Advisory y Administración"
            description="Si eres consultor, tu perfil y tus postulaciones están en el Workflow."
          />
        </div>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div>
        <PageHeader title="Consultores" />
        <p role="alert" className="mt-6 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!list || !visible) return <ConsultoresSkeleton />;

  const hasFilters = onlyAvailable || query.trim() !== "";
  const habilitados = list.filter((c) => c.status === "HABILITADO").length;

  return (
    <div>
      <PageHeader
        title="Consultores"
        description={
          list.length > 0
            ? `${list.length} ${list.length === 1 ? "consultor" : "consultores"}, ${habilitados} ${habilitados === 1 ? "habilitado" : "habilitados"} para tomar casos.`
            : "Directorio de consultores y su disponibilidad."
        }
        actions={
          <Button variant="inverse" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      {list.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="Todavía no hay consultores registrados"
            description="Cuando se registre el primer consultor aparecerá aquí con su especialidad y su estado de validación."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <label className="relative w-full sm:w-auto">
              <span className="sr-only">Buscar consultores</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o especialidad"
                className="w-full rounded-full border border-line-strong bg-surface py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/40 sm:w-80"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Solo disponibles
            </label>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOnlyAvailable(false);
                }}
                className="ml-1 text-sm font-semibold text-ink underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="Ningún consultor coincide con tu búsqueda"
                description="Prueba con otro término o quita los filtros."
              />
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.key} aria-label={g.title} className="mt-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-ink">
                    {g.title} <span className="text-ink-muted">({g.items.length})</span>
                  </h2>
                  <span className="hidden text-sm text-ink sm:inline">{g.hint}</span>
                  <span aria-hidden className="h-px flex-1 bg-line-strong" />
                </div>
                <ul className="card mt-4 divide-y divide-line overflow-hidden">
                  {g.items.map((c) => (
                    <ConsultantRow
                      key={c.id}
                      c={c}
                      open={openIds.has(c.id)}
                      showStatus={g.showStatus}
                      onToggle={() => toggle(c.id)}
                      onChanged={() => load()}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
