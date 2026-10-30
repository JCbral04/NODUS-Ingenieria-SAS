"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, RefreshCw, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { slaTone, statusColor, statusLabel } from "@/lib/case-status";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SlaRing } from "@/components/ui/SlaRing";
import { useToast } from "@/components/ui/Toast";

interface CaseListItem {
  id: number;
  caseNumber: string;
  title: string;
  status: string;
  company: { name: string } | null;
}

interface SlaInfo {
  state?: "OK" | "POR_VENCER" | "VENCIDO";
  percent?: number;
  elapsedHours?: number;
  deadline?: string;
  rule?: { hours: number };
}

type Row = CaseListItem & { sla: SlaInfo };

/** Secciones en el orden en que hay que atenderlas. */
const GROUPS = [
  { key: "VENCIDO", title: "Vencidos", hint: "Ya pasó el plazo" },
  { key: "POR_VENCER", title: "Por vencer", hint: "Atender pronto" },
  { key: "OK", title: "En plazo", hint: "Sin riesgo por ahora" },
  { key: "", title: "Sin plazo", hint: "Su etapa no tiene SLA" },
];

const HOUR = 3_600_000;

/** "Quedan 3 h", "Quedan 2 días", "Venció hace 6 h". */
function remainingText(sla: SlaInfo) {
  if (!sla.deadline) return "";
  const ms = new Date(sla.deadline).getTime() - Date.now();
  const abs = Math.abs(ms);
  const amount =
    abs < HOUR
      ? `${Math.max(1, Math.round(abs / 60_000))} min`
      : abs < 48 * HOUR
        ? `${Math.round(abs / HOUR)} h`
        : `${Math.round(abs / (24 * HOUR))} días`;
  return sla.state === "VENCIDO" || ms < 0 ? `Venció hace ${amount}` : `Quedan ${amount}`;
}

function formatDeadline(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SlaRow({ r, open, onToggle }: { r: Row; open: boolean; onToggle: () => void }) {
  const panelId = `sla-${r.id}`;
  const details: [string, React.ReactNode][] = [
    ["Etapa actual", <span key="s" className={statusColor(r.status)}>{statusLabel(r.status)}</span>],
    ["Plazo de la etapa", r.sla.rule ? `${r.sla.rule.hours} h` : "—"],
    [
      "Transcurrido",
      typeof r.sla.elapsedHours === "number"
        ? `${r.sla.elapsedHours} h${typeof r.sla.percent === "number" ? ` · ${r.sla.percent}%` : ""}`
        : "—",
    ],
    [r.sla.state === "VENCIDO" ? "Vencía" : "Vence", formatDeadline(r.sla.deadline)],
  ];
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-sunken"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm text-ink">
            <span className="font-semibold">{r.caseNumber}</span> · {r.company?.name ?? "—"}
          </span>
          <span className="block truncate text-lg font-semibold text-ink">{r.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-4 text-sm">
          <span className={slaTone(r.sla.state)}>{remainingText(r.sla)}</span>
          <ChevronDown
            aria-hidden
            className={`h-5 w-5 text-ink transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-6 pb-5 pt-3">
          <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink">{k}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={`/casos/${r.id}`}
            className="mt-4 inline-flex rounded-full border border-line-strong bg-surface px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
          >
            Abrir caso
          </Link>
        </div>
      )}
    </li>
  );
}

export default function SlaPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [initialOpen, setInitialOpen] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      setError(null);
      try {
        const list = await apiFetch<CaseListItem[]>("/api/cases");
        const slas = await Promise.all(
          list.map((c) => apiFetch<SlaInfo>(`/api/cases/${c.id}/sla`).catch(() => ({}) as SlaInfo)),
        );
        setRows(list.map((c, i) => ({ ...c, sla: slas[i] })));
        if (manual) toast.success("Tablero de SLA actualizado.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar el SLA";
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

  // El caso más atrasado arranca desplegado.
  useEffect(() => {
    if (!rows || initialOpen) return;
    const first = rows
      .filter((r) => r.sla.state === "VENCIDO" && r.sla.deadline)
      .sort((a, b) => new Date(a.sla.deadline!).getTime() - new Date(b.sla.deadline!).getTime())[0];
    if (first) setOpenIds(new Set([first.id]));
    setInitialOpen(true);
  }, [rows, initialOpen]);

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (error && !rows) {
    return (
      <div>
        <PageHeader title="SLA" />
        <p role="alert" className="mt-6 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load(true)} loading={refreshing}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!rows) {
    return (
      <SkeletonRegion label="Cargando el tablero de SLA">
        <PageHeader title="SLA" />
        <div className="mt-8 flex flex-col items-center gap-6">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="card w-full max-w-[920px] divide-y divide-line">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 p-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-64" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonRegion>
    );
  }

  const known = GROUPS.filter((g) => g.key).map((g) => g.key);
  const byDeadline = (a: Row, b: Row) =>
    (a.sla.deadline ? new Date(a.sla.deadline).getTime() : Infinity) -
    (b.sla.deadline ? new Date(b.sla.deadline).getTime() : Infinity);
  const groups = GROUPS.map((g) => ({
    ...g,
    items: rows
      .filter((r) => (g.key ? r.sla.state === g.key : !r.sla.state || !known.includes(r.sla.state)))
      .sort(byDeadline),
  })).filter((g) => g.items.length > 0);

  const counts = {
    ok: rows.filter((r) => r.sla.state === "OK").length,
    porVencer: rows.filter((r) => r.sla.state === "POR_VENCER").length,
    vencido: rows.filter((r) => r.sla.state === "VENCIDO").length,
  };

  return (
    <div>
      <PageHeader
        title="SLA"
        actions={
          <Button variant="inverse" onClick={() => load(true)} loading={refreshing} loadingText="Actualizando…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </Button>
        }
      />

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Timer}
            title="Todavía no hay casos con plazo"
            description="Cuando se registren casos, aquí verás cuáles están vencidos o por vencer."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex justify-center">
            <SlaRing {...counts} centered />
          </div>

          {groups.map((g) => (
            <section key={g.key || "sin"} aria-label={g.title} className="mx-auto mt-8 max-w-[920px]">
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-px flex-1 bg-line-strong" />
                <h2 className="text-2xl font-semibold text-ink">
                  {g.title} <span className="text-ink-muted">({g.items.length})</span>
                </h2>
                <span className="hidden text-sm text-ink sm:inline">{g.hint}</span>
                <span aria-hidden className="h-px flex-1 bg-line-strong" />
              </div>
              <ul className="card mt-4 divide-y divide-line overflow-hidden">
                {g.items.map((r) => (
                  <SlaRow key={r.id} r={r} open={openIds.has(r.id)} onToggle={() => toggle(r.id)} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
