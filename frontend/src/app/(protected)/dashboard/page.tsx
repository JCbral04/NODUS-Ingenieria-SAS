"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { statusLabel, statusColor } from "@/lib/case-status";

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
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slaCounts, setSlaCounts] = useState<{ vencido: number; porVencer: number } | null>(null);

  useEffect(() => {
    apiFetch<CaseListItem[]>("/api/cases")
      .then(setCases)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar indicadores"));
  }, []);

  useEffect(() => {
    if (!cases || cases.length === 0) return;
    Promise.all(
      cases.map((c) =>
        apiFetch<SlaInfo>(`/api/cases/${c.id}/sla`).catch(() => ({ state: undefined }) as SlaInfo)
      )
    ).then((results) => {
      setSlaCounts({
        vencido: results.filter((r) => r.state === "VENCIDO").length,
        porVencer: results.filter((r) => r.state === "POR_VENCER").length,
      });
    });
  }, [cases]);

  if (error) {
    return <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (!cases) {
    return <p className="text-sm text-ink-muted">Cargando indicadores…</p>;
  }

  const countsByStatus = new Map<string, number>();
  for (const c of cases) {
    countsByStatus.set(c.status, (countsByStatus.get(c.status) ?? 0) + 1);
  }

  const latest = [...cases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">Indicadores generales del pipeline de casos.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">Total de casos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{cases.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">SLA vencido</p>
          <p className="mt-1 text-2xl font-bold text-danger">
            {slaCounts ? slaCounts.vencido : "…"}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">SLA por vencer</p>
          <p className="mt-1 text-2xl font-bold text-warn">
            {slaCounts ? slaCounts.porVencer : "…"}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">Estados distintos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{countsByStatus.size}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold text-ink">Casos por estado</h2>
          {countsByStatus.size === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Todavía no hay casos registrados.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {[...countsByStatus.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(status)}`}>
                      {statusLabel(status)}
                    </span>
                    <span className="text-sm text-ink-soft">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold text-ink">Últimos casos creados</h2>
          {latest.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Todavía no hay casos registrados.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {latest.map((c) => (
                <li key={c.id}>
                  <Link href={`/casos/${c.id}`} className="flex items-center justify-between hover:underline">
                    <div>
                      <p className="text-sm font-medium text-ink">{c.caseNumber} — {c.title}</p>
                      <p className="text-xs text-ink-muted">{c.company?.name ?? "—"}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}