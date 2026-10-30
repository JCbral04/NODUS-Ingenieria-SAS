"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlarmClock, Briefcase, Layers, RefreshCw, ShieldAlert, type LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { statusLabel, statusColor } from "@/lib/case-status";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  createdAt: string;
  company: { name: string };
}

interface SlaInfo {
  state?: "OK" | "POR_VENCER" | "VENCIDO";
}

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [slaCounts, setSlaCounts] = useState<{ vencido: number; porVencer: number } | null>(null);

  const load = useCallback(async (manual = false) => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await apiFetch<CaseListItem[]>("/api/cases");
      setCases(list);
      setSlaCounts(null);
      const results = await Promise.all(
        list.map((c) =>
          apiFetch<SlaInfo>(`/api/cases/${c.id}/sla`).catch(() => ({ state: undefined }) as SlaInfo)
        )
      );
      setSlaCounts({
        vencido: results.filter((r) => r.state === "VENCIDO").length,
        porVencer: results.filter((r) => r.state === "POR_VENCER").length,
      });
      if (manual) toast.success("Indicadores actualizados.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar indicadores";
      setError(message);
      if (manual) toast.error(message);
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    // Solo al montar: el refresco posterior es manual.
  }, []);

  if (error && !cases) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p role="alert" className="mt-4 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
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
      <SkeletonRegion label="Cargando indicadores">
        <PageHeader title="Dashboard" description={<Skeleton className="h-4 w-64" />} />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="card mt-8 space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  if (cases.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="mt-6">
          <EmptyState
            icon={Briefcase}
            title="Todavía no hay casos en el pipeline"
            description="Cuando una empresa registre su necesidad, vas a ver aquí cuántos casos hay, en qué estado están y cuáles tienen el SLA en riesgo."
          >
            <Link
              href="/registro-caso"
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-strong"
            >
              Registrar un caso
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const countsByStatus = new Map<string, number>();
  for (const c of cases) {
    countsByStatus.set(c.status, (countsByStatus.get(c.status) ?? 0) + 1);
  }
  const sortedStatuses = [...countsByStatus.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sortedStatuses[0]?.[1] ?? 1;

  const latest = [...cases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Dashboard"}
        description="Así va el pipeline de casos hoy."
        actions={
          <Button variant="secondary" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        <Stat icon={Briefcase} label="Total de casos" value={cases.length} badge="bg-primary-soft text-ink" />
        <Stat icon={ShieldAlert} label="SLA vencido" value={slaCounts?.vencido} tone="text-ink" badge="bg-ink text-white" />
        <Stat icon={AlarmClock} label="SLA por vencer" value={slaCounts?.porVencer} tone="text-ink" badge="border border-ink bg-surface text-ink" />
        <Stat icon={Layers} label="Estados distintos" value={countsByStatus.size} badge="bg-info-soft text-ink" />
      </div>

      <div className="card mt-8 grid grid-cols-1 divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="p-6">
          <h2 className="text-lg font-semibold text-ink">Casos por estado</h2>
          <p className="mt-1 text-xs text-ink-muted">Toca un estado para ver sus casos.</p>
          <ul className="mt-4 space-y-1">
            {sortedStatuses.map(([status, count]) => (
              <li key={status}>
                <Link
                  href={`/casos?estado=${status}`}
                  className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-sunken"
                >
                  <span
                    className={`w-44 shrink-0 truncate text-sm ${statusColor(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken group-hover:bg-line/60">
                    <span
                      className="block h-full rounded-full bg-primary/70 group-hover:bg-primary"
                      style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-sm font-medium text-ink-soft">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-6">
          <h2 className="text-lg font-semibold text-ink">Últimos casos creados</h2>
          <ul className="mt-4 space-y-1">
            {latest.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/casos/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-sunken"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {c.caseNumber} — {c.title}
                    </p>
                    <p className="text-xs text-ink-muted">{c.company?.name ?? "—"}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm ${statusColor(c.status)}`}
                  >
                    {statusLabel(c.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/casos" className="mt-3 inline-block text-sm font-semibold text-ink underline underline-offset-4">
            Ver todos los casos
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-ink",
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  tone?: string;
  badge: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
      <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${badge}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-1 h-8 w-10" />
        ) : (
          <p className={`font-display text-3xl font-bold leading-tight ${tone}`}>{value}</p>
        )}
      </div>
    </div>
  );
}
