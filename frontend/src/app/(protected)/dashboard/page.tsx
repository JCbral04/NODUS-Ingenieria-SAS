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
    return <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>;
  }

  if (!cases) {
    return <p className="text-sm text-slate-500">Cargando indicadores…</p>;
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
      <p className="mt-1 text-sm text-slate-400">Indicadores generales del pipeline de casos.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-500">Total de casos</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{cases.length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-500">SLA vencido</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {slaCounts ? slaCounts.vencido : "…"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-500">SLA por vencer</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {slaCounts ? slaCounts.porVencer : "…"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-500">Estados distintos</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{countsByStatus.size}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-100">Casos por estado</h2>
          {countsByStatus.size === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Todavía no hay casos registrados.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {[...countsByStatus.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(status)}`}>
                      {statusLabel(status)}
                    </span>
                    <span className="text-sm text-slate-300">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-100">Últimos casos creados</h2>
          {latest.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Todavía no hay casos registrados.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {latest.map((c) => (
                <li key={c.id}>
                  <Link href={`/casos/${c.id}`} className="flex items-center justify-between hover:underline">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{c.caseNumber} — {c.title}</p>
                      <p className="text-xs text-slate-500">{c.company?.name ?? "—"}</p>
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