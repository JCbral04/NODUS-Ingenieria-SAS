"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ALL_STATUSES, statusLabel, statusColor } from "@/lib/case-status";

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

export default function CasosPage() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("TODOS");

  useEffect(() => {
    apiFetch<CaseListItem[]>("/api/cases")
      .then(setCases)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar casos"));
  }, []);

  const visibleCases =
    cases && filter !== "TODOS" ? cases.filter((c) => c.status === filter) : cases;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Casos</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-line-strong bg-sunken px-3 py-1.5 text-sm text-ink"
        >
          <option value="TODOS">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {!error && !cases && <p className="mt-6 text-sm text-ink-muted">Cargando casos…</p>}

      {cases && cases.length === 0 && (
        <p className="mt-6 text-sm text-ink-muted">Todavía no hay casos registrados.</p>
      )}

      {visibleCases && visibleCases.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunken text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium"># Caso</th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Urgencia</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {visibleCases.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-line hover:bg-sunken"
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

      {visibleCases && visibleCases.length === 0 && cases && cases.length > 0 && (
        <p className="mt-6 text-sm text-ink-muted">No hay casos con ese estado.</p>
      )}
    </div>
  );
}