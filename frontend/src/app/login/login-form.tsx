"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginForm = z.infer<typeof loginSchema>;

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sidebar via-sidebar to-primary px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl bg-surface px-6 py-10 shadow-xl sm:px-14 sm:py-14">
        <LogoMark size={64} className="mx-auto" />

        <h1 className="mt-6 text-center text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Iniciar sesión
          <br />
          en NODUS
        </h1>
        <p className="mt-4 text-center text-base text-ink-soft">
          Ingresa o registra tu caso para gestionar tus proyectos hoy.
        </p>

        <div className="mx-auto mt-10 max-w-md">
          {infoMessage && (
            <div role="status" className="mb-5 rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="mt-1 w-full rounded-none border-0 border-b-2 border-line-strong bg-transparent px-0.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus-visible:shadow-none"
                placeholder="tucorreo@nodus.co"
              />
              {errors.email && <p className="mt-1 text-xs text-ink">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="mt-1 w-full rounded-none border-0 border-b-2 border-line-strong bg-transparent px-0.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus-visible:shadow-none"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-ink">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              loading={submitting}
              loadingText="Ingresando…"
              className="mt-3 w-full rounded-full py-3.5 text-base"
            >
              Ingresar
            </Button>
          </form>

          <Link
            href="/registro-caso"
            className="mt-3 flex w-full items-center justify-center rounded-full border border-line-strong bg-surface py-3 text-base font-semibold text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
          >
            Registrar un caso
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/90">
        Al continuar aceptas los términos y condiciones de la plataforma NODUS Ingeniería SAS.
      </p>
    </main>
  );
}
