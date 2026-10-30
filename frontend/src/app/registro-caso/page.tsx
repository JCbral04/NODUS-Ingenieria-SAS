"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AREAS, URGENCIAS, IMPACTOS } from "@/lib/lov";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const step1Schema = z.object({
  companyName: z.string().min(1, "Requerido"),
  taxId: z.string().optional(),
  country: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  contactName: z.string().min(1, "Requerido"),
  position: z.string().min(1, "Requerido"),
  email: z.string().email("Ingresa un correo válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  acceptsTerms: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

const step2Schema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres"),
  description: z.string().min(20, "Cuéntanos un poco más (mínimo 20 caracteres)"),
  areaId: z.coerce.number({ error: "Selecciona un área" }),
  urgencyId: z.coerce.number({ error: "Selecciona la urgencia" }),
  impactId: z.coerce.number({ error: "Selecciona el impacto" }),
});

const fullSchema = step1Schema.extend(step2Schema.shape);
// Con zod 4 las conversiones (coerce) hacen que la entrada y la salida del formulario difieran.
type FormInput = z.input<typeof fullSchema>;
type FormValues = z.output<typeof fullSchema>;

const STEP1_FIELDS = Object.keys(step1Schema.shape) as (keyof FormInput)[];

export default function RegistroCasoPage() {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(fullSchema) });

  async function goToStep2() {
    const valid = await trigger(STEP1_FIELDS);
    if (valid) setStep(2);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Ya existe una empresa registrada con ese correo/NIT.");
        }
        throw new Error("No se pudo registrar el caso. Intenta de nuevo.");
      }

      const data = await res.json();
      // TODO: confirmar con Juan la forma exacta de la respuesta cuando el
      // endpoint POST /api/cases esté disponible (issue #17). Por ahora se
      // asume { caseNumber: string } según el criterio de aceptación.
      setCaseNumber(data.caseNumber ?? data.case?.caseNumber ?? null);
      toast.success("Tu caso quedó registrado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (caseNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md card border-ok/40 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-ink">¡Caso registrado!</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Tu número de caso es:
          </p>
          <p className="mt-3 rounded-md bg-sunken px-4 py-3 text-2xl font-bold tracking-wider text-ink">
            {caseNumber}
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Guarda este número, lo necesitarás para hacerle seguimiento a tu caso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 py-10">
      <Logo />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card w-full max-w-lg px-6 py-8 shadow-xl sm:px-10 sm:py-10"
      >
        <h1 className="text-3xl font-bold tracking-tight text-ink">Registra tu caso</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Paso {step} de 2 — {step === 1 ? "Datos de tu empresa" : "Cuéntanos qué necesitas"}
        </p>

        {step === 1 && (
          <div className="mt-6 space-y-5">
            <Field label="Nombre de la empresa" error={errors.companyName?.message}>
              <input {...register("companyName")} className={inputClass} />
            </Field>
            <Field label="NIT (opcional)" error={errors.taxId?.message}>
              <input {...register("taxId")} className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field label="País" error={errors.country?.message}>
                <input {...register("country")} className={inputClass} />
              </Field>
              <Field label="Ciudad" error={errors.city?.message}>
                <input {...register("city")} className={inputClass} />
              </Field>
            </div>
            <Field label="Nombre de contacto" error={errors.contactName?.message}>
              <input {...register("contactName")} className={inputClass} />
            </Field>
            <Field label="Cargo" error={errors.position?.message}>
              <input {...register("position")} className={inputClass} />
            </Field>
            <Field label="Correo" error={errors.email?.message}>
              <input type="email" {...register("email")} className={inputClass} />
            </Field>
            <Field label="Teléfono" error={errors.phone?.message}>
              <input {...register("phone")} className={inputClass} />
            </Field>
            <Field label="Contraseña" error={errors.password?.message}>
              <input type="password" {...register("password")} className={inputClass} />
            </Field>

            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input type="checkbox" {...register("acceptsTerms")} className="mt-1" />
              Acepto los términos y condiciones de la plataforma
            </label>
            {errors.acceptsTerms && (
              <p className="text-xs text-ink">{errors.acceptsTerms.message}</p>
            )}

            <Button className="w-full py-3.5 text-base" onClick={goToStep2}>
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-5">
            <Field label="Título del caso" error={errors.title?.message}>
              <input {...register("title")} className={inputClass} />
            </Field>
            <Field label="Descripción" error={errors.description?.message}>
              <textarea rows={4} {...register("description")} className={inputClass} />
            </Field>
            <Field label="Área" error={errors.areaId?.message}>
              <select {...register("areaId", { valueAsNumber: true })} className={inputClass} defaultValue="">
                <option value="" disabled>Selecciona un área</option>
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Urgencia" error={errors.urgencyId?.message}>
              <select {...register("urgencyId", { valueAsNumber: true })} className={inputClass} defaultValue="">
                <option value="" disabled>Selecciona la urgencia</option>
                {URGENCIAS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Impacto" error={errors.impactId?.message}>
              <select {...register("impactId", { valueAsNumber: true })} className={inputClass} defaultValue="">
                <option value="" disabled>Selecciona el impacto</option>
                {IMPACTOS.map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
            </Field>

            {serverError && (
              <p className="rounded-md border-l-4 border-ink bg-info-soft px-3 py-2 text-sm text-ink">
                {serverError}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="w-1/3 py-3.5 text-base" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="submit" className="w-2/3 py-3.5 text-base" loading={submitting} loadingText="Enviando…">
                Registrar caso
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

const inputClass = "input-line mt-1";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-line">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-ink">{error}</p>}
    </div>
  );
}