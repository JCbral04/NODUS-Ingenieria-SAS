"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { STAGES, stageOf } from "@/lib/case-status";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { SlaRing, type SlaCounts } from "@/components/ui/SlaRing";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  createdAt: string;
  company: { name: string };
  urgency: { label: string } | null;
}

interface SlaInfo {
  state?: "OK" | "POR_VENCER" | "VENCIDO";
}


/** Filas del mapa, de lo más urgente a lo menos. La clave coincide con el filtro ?urgencia= de Casos. */
const URGENCY_ROWS = [
  { key: "Alta", label: "Urgencia alta" },
  { key: "Media", label: "Urgencia media" },
  { key: "Baja", label: "Urgencia baja" },
  { key: "sin", label: "Sin urgencia" },
];

function urgencyKey(c: CaseListItem) {
  const label = c.urgency?.label;
  return label === "Alta" || label === "Media" || label === "Baja" ? label : "sin";
}

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sla, setSla] = useState<SlaCounts | null>(null);

  const load = useCallback(async (manual = false) => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await apiFetch<CaseListItem[]>("/api/cases");
      setCases(list);
      setSla(null);
      const results = await Promise.all(
        list.map((c) =>
          apiFetch<SlaInfo>(`/api/cases/${c.id}/sla`).catch(() => ({ state: undefined }) as SlaInfo)
        )
      );
      setSla({
        ok: results.filter((r) => r.state === "OK").length,
        porVencer: results.filter((r) => r.state === "POR_VENCER").length,
        vencido: results.filter((r) => r.state === "VENCIDO").length,
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

  // Cuántos casos hay en cada cruce de urgencia y etapa.
  const matrix = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cases ?? []) {
      const stage = stageOf(c.status);
      if (!stage) continue;
      const k = `${urgencyKey(c)}|${stage}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [cases]);

  if (error && !cases) {
    return (
      <div>
        <PageHeader title="Dashboard" />
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
      <SkeletonRegion label="Cargando indicadores">
        <PageHeader title="Dashboard" />
        <div className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {Array.from({ length: 21 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="mt-10 flex items-center gap-8">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-24 w-40" />
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
            description="Cuando una empresa registre su necesidad, vas a ver aquí dónde se acumula el trabajo y cuáles casos tienen el SLA en riesgo."
          >
            <Link
              href="/registro-caso"
              className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:bg-primary-strong"
            >
              Registrar un caso
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const rows = URGENCY_ROWS.filter((r) => r.key !== "sin" || cases.some((c) => urgencyKey(c) === "sin"));
  const maxCell = Math.max(1, ...matrix.values());

  return (
    <div>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Dashboard"}
        actions={
          <Button variant="inverse" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      <section aria-label="Casos por urgencia y etapa" className="mt-8">
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-2.5">
            <thead>
              <tr>
                <td className="w-36" />
                {STAGES.map((s) => (
                  <th key={s.key} scope="col" className="px-1 pb-1 text-left text-sm font-semibold text-ink">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="pr-2 text-left text-base font-semibold text-ink">
                    {r.label}
                  </th>
                  {STAGES.map((s) => {
                    const n = matrix.get(`${r.key}|${s.key}`) ?? 0;
                    return (
                      <td key={s.key} className="p-0">
                        <HeatCell
                          n={n}
                          intensity={n / maxCell}
                          href={`/casos?etapa=${s.key}&urgencia=${r.key}`}
                          label={`${n} ${n === 1 ? "caso" : "casos"}, ${r.label}, ${s.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-ink">Toca una casilla para ver sus casos.</p>
      </section>

      <section
        aria-label="Cumplimiento de SLA"
        className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-line-strong pt-8"
      >
        <h2 className="w-36 text-2xl font-semibold leading-tight text-ink">Cumplimiento de SLA</h2>
        {sla ? (
          <SlaRing {...sla} />
        ) : (
          <div className="flex items-center gap-8" aria-hidden>
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-24 w-40" />
          </div>
        )}
      </section>
    </div>
  );
}

/** Casilla del mapa: el verde se intensifica con la cantidad, el número siempre va en negro. */
function HeatCell({
  n,
  intensity,
  href,
  label,
}: {
  n: number;
  intensity: number;
  href: string;
  label: string;
}) {
  const cls =
    "flex h-20 items-center justify-center rounded-2xl border border-line font-display text-3xl font-bold text-ink";
  if (n === 0) {
    return (
      <span aria-label={label} className={`${cls} bg-surface`}>
        0
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      style={{ backgroundColor: `rgb(var(--primary) / ${(0.15 + 0.4 * intensity).toFixed(2)})` }}
      className={`${cls} transition-shadow hover:ring-2 hover:ring-ink`}
    >
      {n}
    </Link>
  );
}
