"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CONSULTANT_TRANSITIONS,
  consultantStatusLabel,
  levelLabel,
  modalityLabel,
  type ConsultantProfile,
} from "@/lib/consultant";
import { Skeleton, SkeletonRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsultantStatusButtons } from "@/components/consultores/StatusButtons";

const BACK = (
  <Link href="/consultores" className="hover:underline">
    ← Volver a Consultores
  </Link>
);

export default function ConsultorDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const canManage = user?.role === "ADVISORY" || user?.role === "ADMIN";

  const [data, setData] = useState<ConsultantProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiFetch<ConsultantProfile>(`/api/consultants/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el consultor");
    }
  }, [id]);

  useEffect(() => {
    if (canManage) load();
  }, [canManage, load]);

  if (!user) return null;

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Consultor" eyebrow={BACK} />
        <div className="mt-8">
          <EmptyState icon={UserX} title="Solo Advisory y Administración pueden ver este perfil" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Consultor" eyebrow={BACK} />
        <p role="alert" className="mt-6 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <SkeletonRegion label="Cargando consultor">
        <PageHeader title="Consultor" eyebrow={BACK} />
        <div className="card mt-8 space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </SkeletonRegion>
    );
  }

  const rows: [string, string][] = [
    ["Correo", data.user.email],
    ["Especialidad", data.specialty?.label ?? "Sin especialidad"],
    ["Nivel", levelLabel(data.levelCode)],
    ["Modalidad", modalityLabel(data.modality)],
    ["Sponsor", data.sponsorName ?? "—"],
    ["Experiencia", `${data.experienceYears} ${data.experienceYears === 1 ? "año" : "años"}`],
    ["Disponibilidad", data.availability ? "Disponible" : "No disponible"],
  ];

  return (
    <div>
      <PageHeader
        eyebrow={BACK}
        title={data.user.fullName}
        actions={<span className="text-base font-semibold text-white">{consultantStatusLabel(data.status)}</span>}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card divide-y divide-line lg:col-span-2">
          <section className="p-6">
            <h2 className="text-lg font-semibold text-ink">Perfil</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="p-6">
            <h2 className="text-lg font-semibold text-ink">Biografía</h2>
            <p className="mt-2 text-sm text-ink">{data.bio?.trim() || "Este consultor todavía no ha escrito su biografía."}</p>
          </section>
        </div>

        <section className="card h-fit p-6">
          <h2 className="text-lg font-semibold text-ink">Estado de validación</h2>
          <div className="mt-3">
            <ConsultantStatusButtons consultant={data} note={note} onChanged={async () => { setNote(""); await load(); }} />
          </div>
          {((CONSULTANT_TRANSITIONS[data.status] ?? []).length > 0) && (
            <label className="mt-5 block">
              <span className="label-line">Nota (opcional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="Por qué haces este cambio"
                className="input-line"
              />
            </label>
          )}
        </section>
      </div>
    </div>
  );
}
