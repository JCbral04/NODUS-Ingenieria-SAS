"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { statusLabel } from "@/lib/case-status";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Recorrido real de un caso (ver WorkflowService). El último nodo es el destino.
const CASE_PATH = ["CREADO", "CLASIFICADO", "ASIGNADO", "PROPUESTA_ENVIADA", "EN_EJECUCION", "CERRADO"];

export function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const infoMessage = searchParams.get("message");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <Logo tone="light" />

        <div>
          <h2 className="max-w-sm font-display text-4xl font-bold leading-tight text-white">
            Cada caso, de la solicitud al cierre.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-sidebar-ink">
            Mipymes y consultores en un mismo flujo, con cada paso registrado y los plazos a la vista.
          </p>

          <ol className="relative mt-10 space-y-5">
            <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-sidebar-line" />
            {CASE_PATH.map((code, i) => {
              const last = i === CASE_PATH.length - 1;
              return (
                <li key={code} className="relative flex items-center gap-4 pl-7 text-sm">
                  <span
                    aria-hidden
                    className={
                      last
                        ? "absolute left-0 h-[11px] w-[11px] rounded-full bg-accent ring-4 ring-accent/25"
                        : "absolute left-0 h-[11px] w-[11px] rounded-full bg-sidebar ring-2 ring-sidebar-line"
                    }
                  />
                  <span className={last ? "font-medium text-white" : "text-sidebar-ink"}>
                    {statusLabel(code)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="text-xs text-sidebar-ink">NODUS Ingeniería SAS</p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />

          <div className="rounded-xl border border-line bg-surface p-8">
            <h1 className="text-2xl font-bold text-ink">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-ink-soft">Entra a tu espacio de trabajo en NODUS.</p>

            {infoMessage && (
              <div
                role="status"
                className="mt-4 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn"
              >
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
                  placeholder="tucorreo@nodus.co"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  className="mt-1 w-full rounded-md border border-line-strong bg-sunken px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
              >
                {submitting ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ¿Tu empresa necesita un consultor?{" "}
            <Link href="/registro-caso" className="font-medium text-primary underline underline-offset-2">
              Registra un caso
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
