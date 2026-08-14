"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import {
  ACEPTA_LABELS,
  CONVIVENCIA_LABELS,
  CONVIVENCIAS,
  HOGAR_ACEPTA,
  type Convivencia,
  type HogarAcepta,
} from "@/lib/hogares/types";
import { solicitudInputSchema } from "@/lib/hogares/validation";
import { formatZodErrors } from "@/lib/validation";
import type { ApiError } from "@/lib/types";

/*
 * Formulario para solicitar un hogar de paso.
 * ------------------------------------------------------------------------
 * Mismo patrón que <ReportForm>/<OfrecerForm>: validación en cliente con el
 * MISMO esquema zod que la API (`solicitudInputSchema`), errores por campo,
 * POST y pantalla de gracias que explica el código de seguridad mutuo.
 *
 * La solicitud es enteramente privada: nunca se lista en la página. Por eso
 * el formulario pide lo mínimo y lo dice en el aviso antes de enviar.
 *
 * Si la persona llegó desde la tarjeta de un hogar (?hogar=ID en la URL), la
 * página nos pasa ese ID y lo dejamos anotado en las notas iniciales: así el
 * equipo sabe qué hogar le interesó sin complicar el esquema con otro campo.
 */

const EMPTY_ERRORS: Record<string, string[]> = {};

export default function SolicitarForm({
  hogarInteres = null,
}: {
  /** ID del hogar que le interesó a la persona (viene de ?hogar= en la URL). */
  hogarInteres?: string | null;
}) {
  // --- Estado del formulario ----------------------------------------------
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  // Como string para no pelear con inputs numéricos vacíos.
  const [personas, setPersonas] = useState("");
  const [composicion, setComposicion] = useState<Set<HogarAcepta>>(new Set());
  const [preferencias, setPreferencias] = useState<Set<Convivencia>>(new Set());
  const [notas, setNotas] = useState(
    hogarInteres ? `Interesada en el hogar ${hogarInteres}. ` : "",
  );

  // --- Estado de envío / errores ------------------------------------------
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]>>(EMPTY_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const errFor = (field: string): string | undefined =>
    fieldErrors[field]?.[0];

  // --- Acciones -----------------------------------------------------------
  const toggleComposicion = useCallback((v: HogarAcepta) => {
    setComposicion((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const togglePreferencia = useCallback((v: Convivencia) => {
    setPreferencias((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setNombre("");
    setTelefono("");
    setCiudad("");
    setPersonas("");
    setComposicion(new Set());
    setPreferencias(new Set());
    setNotas("");
    setFieldErrors(EMPTY_ERRORS);
    setFormError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const candidate = {
      nombre,
      telefono,
      ciudad,
      personas: personas === "" ? undefined : Number(personas),
      composicion: Array.from(composicion),
      preferencias: Array.from(preferencias),
      notas: notas.trim() === "" ? null : notas,
    };

    // Validación en cliente (mismo esquema que el servidor).
    const result = solicitudInputSchema.safeParse(candidate);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFieldErrors(EMPTY_ERRORS);
    setSubmitting(true);
    try {
      const res = await fetch("/api/hogares/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 201) {
        track("hogar_solicitado"); // evento: solicitud de hospedaje enviada
        setSuccess(true);
        resetForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (res.status === 400) {
        const data = (await res.json()) as ApiError;
        setFieldErrors(data.fields ?? EMPTY_ERRORS);
        setFormError(
          data.error ?? "Revisa los campos marcados e inténtalo de nuevo.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setFormError(
        "No pudimos enviar tu solicitud en este momento. Inténtalo más tarde.",
      );
    } catch {
      setFormError(
        "Hubo un problema de conexión. Revisa tu internet e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Pantalla de éxito: qué sigue y cómo funciona el código mutuo ---------
  if (success) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <span aria-hidden="true" className="text-4xl">
          🤝
        </span>
        <h2 className="mt-2 text-xl font-bold text-brand-900">
          Recibimos tu solicitud
        </h2>
        <div className="mx-auto mt-3 max-w-md space-y-2 text-left text-sm text-brand-800">
          <p>
            El equipo te llamará al teléfono que dejaste y te propondrá un{" "}
            <strong>hogar verificado</strong> que respete tus preferencias.
          </p>
          <p>
            <strong>Tu código de seguridad:</strong> cuando haya un hogar para
            ti, tú y la familia anfitriona recibirán el mismo código. Compárenlo
            al llegar: <strong>si no coincide, no entres y llámanos.</strong>
          </p>
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href="/hogares"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Ver hogares de paso
          </Link>
          <Link
            href="/ayuda"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-600 bg-surface px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            Más ayudas disponibles
          </Link>
        </div>
      </div>
    );
  }

  // --- Formulario ----------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Error general (incluye errores devueltos por la API) */}
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {formError}
        </div>
      )}

      <Field label="Tu nombre completo" htmlFor="nombre" required error={errFor("nombre")}>
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Carlos Andrés Ruiz"
          aria-invalid={!!errFor("nombre")}
          aria-describedby={errFor("nombre") ? "nombre-error" : undefined}
          className={inputClass(!!errFor("nombre"))}
        />
      </Field>

      <Field
        label="Teléfono"
        htmlFor="telefono"
        required
        error={errFor("telefono")}
        hint="Por aquí te llama el equipo. Nunca se publica."
      >
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej. +57 300 123 4567"
          aria-invalid={!!errFor("telefono")}
          aria-describedby={errFor("telefono") ? "telefono-error" : undefined}
          className={inputClass(!!errFor("telefono"))}
        />
      </Field>

      <Field
        label="¿En qué ciudad necesitas hogar?"
        htmlFor="ciudad"
        required
        error={errFor("ciudad")}
      >
        <input
          id="ciudad"
          name="ciudad"
          type="text"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          placeholder="Ej. Manizales"
          aria-invalid={!!errFor("ciudad")}
          aria-describedby={errFor("ciudad") ? "ciudad-error" : undefined}
          className={inputClass(!!errFor("ciudad"))}
        />
      </Field>

      <Field
        label="¿Cuántas personas son?"
        htmlFor="personas"
        required
        error={errFor("personas")}
        hint="Sin contar las mascotas; a ellas las anotas abajo."
      >
        <input
          id="personas"
          name="personas"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={personas}
          onChange={(e) => setPersonas(e.target.value)}
          placeholder="Ej. 4"
          aria-invalid={!!errFor("personas")}
          aria-describedby={errFor("personas") ? "personas-error" : undefined}
          className={inputClass(!!errFor("personas"))}
        />
      </Field>

      {/* Composición del grupo: chips multiselección (incluye mascotas) */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          ¿Quiénes son?{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="mt-0.5 text-xs text-foreground/55">
          Selecciona todo lo que aplique, incluidas las mascotas que viajan con
          ustedes.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HOGAR_ACEPTA.map((v) => {
            const checked = composicion.has(v);
            return (
              <label
                key={v}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  checked
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-border bg-surface text-foreground/80 hover:border-brand-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="composicion"
                  value={v}
                  checked={checked}
                  onChange={() => toggleComposicion(v)}
                  className="size-4 accent-brand-600"
                />
                <span className="leading-tight">{ACEPTA_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("composicion") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("composicion")}
          </p>
        )}
      </fieldset>

      {/* Preferencias de convivencia: opcionales y SIEMPRE respetadas */}
      <fieldset className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          ¿Con qué tipo de hogar te sentirías más segura/o?
        </legend>
        <p className="mt-0.5 text-xs text-foreground/60">
          Opcional, pero el equipo lo respeta siempre: nunca te propondrá un
          hogar que no cumpla lo que marques aquí.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONVIVENCIAS.map((v) => {
            const checked = preferencias.has(v);
            return (
              <label
                key={v}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  checked
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-border bg-surface text-foreground/80 hover:border-brand-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="preferencias"
                  value={v}
                  checked={checked}
                  onChange={() => togglePreferencia(v)}
                  className="size-4 accent-brand-600"
                />
                <span>{CONVIVENCIA_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("preferencias") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("preferencias")}
          </p>
        )}
      </fieldset>

      <Field
        label="Notas (opcional)"
        htmlFor="notas"
        error={errFor("notas")}
        hint="Lo que el equipo deba saber: salud, movilidad, hasta cuándo necesitas el hogar…"
      >
        <textarea
          id="notas"
          name="notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej. Somos mi mamá, mis dos hijos y una perrita pequeña."
          aria-invalid={!!errFor("notas")}
          aria-describedby={errFor("notas") ? "notas-error" : undefined}
          className={inputClass(!!errFor("notas")) + " resize-y"}
        />
      </Field>

      {/* Aviso de privacidad, justo antes del envío */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        <span aria-hidden="true" className="mt-px shrink-0 text-base">
          🔒
        </span>
        <p className="leading-relaxed">
          <strong className="font-semibold">
            Tu solicitud es privada: nadie la ve en la página.
          </strong>{" "}
          El equipo te llamará y te propondrá un hogar verificado.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Enviando…
          </>
        ) : (
          <>
            <span aria-hidden="true">🤝</span>
            Enviar mi solicitud
          </>
        )}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes / utilidades de presentación (mismo patrón que ReportForm)  */
/* -------------------------------------------------------------------------- */

/** Clases base de inputs/textarea; resalta en rojo cuando hay error. */
function inputClass(hasError: boolean): string {
  return `w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${
    hasError ? "border-red-400 focus:ring-red-400/40" : "border-border"
  }`;
}

/** Envoltorio de campo: etiqueta, pista opcional, control y mensaje de error. */
function Field({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {hint && <p className="-mt-0.5 text-xs text-foreground/55">{hint}</p>}
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
