"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import {
  ACEPTA_LABELS,
  CONVIVENCIA_LABELS,
  CONVIVENCIAS,
  DURACION_LABELS,
  HOGAR_ACEPTA,
  HOGAR_DURACIONES,
  HOGAR_OFRECE,
  OFRECE_LABELS,
  type Convivencia,
  type HogarAcepta,
  type HogarDuracion,
  type HogarOfrece,
} from "@/lib/hogares/types";
import { hogarInputSchema } from "@/lib/hogares/validation";
import { formatZodErrors } from "@/lib/validation";
import type { ApiError } from "@/lib/types";

/*
 * Formulario para ofrecer un hogar de paso.
 * ------------------------------------------------------------------------
 * Mismo patrón que <ReportForm>: validación en cliente con el MISMO esquema
 * zod que usa la API (`hogarInputSchema`), errores por campo, POST y pantalla
 * de gracias. La diferencia de fondo es la privacidad: aquí se piden datos
 * sensibles (teléfono, documento, dirección) que JAMÁS se publican; el aviso
 * antes del botón de envío lo dice de forma explícita para que nadie ofrezca
 * su casa sin entender qué pasa con sus datos.
 */

const EMPTY_ERRORS: Record<string, string[]> = {};

export default function OfrecerForm() {
  // --- Estado del formulario ----------------------------------------------
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [zona, setZona] = useState("");
  const [direccion, setDireccion] = useState("");
  // Capacidad como string para no pelear con inputs numéricos vacíos;
  // se convierte a número justo antes de validar.
  const [capacidad, setCapacidad] = useState("");
  const [acepta, setAcepta] = useState<Set<HogarAcepta>>(new Set());
  const [ofrece, setOfrece] = useState<Set<HogarOfrece>>(new Set());
  const [duracion, setDuracion] = useState<HogarDuracion | "">("");
  const [convivencia, setConvivencia] = useState<Convivencia | "">("");
  const [notas, setNotas] = useState("");

  // --- Estado de envío / errores ------------------------------------------
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]>>(EMPTY_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const errFor = (field: string): string | undefined =>
    fieldErrors[field]?.[0];

  // --- Acciones -----------------------------------------------------------
  const toggleAcepta = useCallback((v: HogarAcepta) => {
    setAcepta((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const toggleOfrece = useCallback((v: HogarOfrece) => {
    setOfrece((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setNombre("");
    setTelefono("");
    setDocumento("");
    setCiudad("");
    setZona("");
    setDireccion("");
    setCapacidad("");
    setAcepta(new Set());
    setOfrece(new Set());
    setDuracion("");
    setConvivencia("");
    setNotas("");
    setFieldErrors(EMPTY_ERRORS);
    setFormError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Los opcionales vacíos viajan como null; capacidad/duración/convivencia
    // vacías pasan como undefined para que zod muestre su propio mensaje.
    const candidate = {
      nombre,
      telefono,
      documento: documento.trim() === "" ? null : documento,
      direccion: direccion.trim() === "" ? null : direccion,
      ciudad,
      zona: zona.trim() === "" ? null : zona,
      capacidad: capacidad === "" ? undefined : Number(capacidad),
      acepta: Array.from(acepta),
      ofrece: Array.from(ofrece),
      duracion: duracion === "" ? undefined : duracion,
      convivencia: convivencia === "" ? undefined : convivencia,
      notas: notas.trim() === "" ? null : notas,
    };

    // Validación en cliente (mismo esquema que el servidor).
    const result = hogarInputSchema.safeParse(candidate);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFieldErrors(EMPTY_ERRORS);
    setSubmitting(true);
    try {
      const res = await fetch("/api/hogares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 201) {
        track("hogar_ofrecido"); // evento: hogar registrado con éxito
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
        "No pudimos registrar tu hogar en este momento. Inténtalo más tarde.",
      );
    } catch {
      setFormError(
        "Hubo un problema de conexión. Revisa tu internet e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Pantalla de éxito: explica los siguientes pasos ----------------------
  if (success) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <span aria-hidden="true" className="text-4xl">
          🏠
        </span>
        <h2 className="mt-2 text-xl font-bold text-brand-900">
          ¡Gracias por abrir las puertas de tu casa!
        </h2>
        <div className="mx-auto mt-3 max-w-md space-y-2 text-left text-sm text-brand-800">
          <p>
            <strong>1. Tu hogar ya está publicado, sin tus datos.</strong> Solo
            se muestra la ciudad, la zona, a quiénes recibes y qué ofreces.
            Nunca tu nombre, teléfono, documento ni dirección.
          </p>
          <p>
            <strong>2. Alguien lo solicita.</strong> Las solicitudes son
            privadas; cuando una familia coincida contigo, las dos partes
            comparten el contacto — nunca antes.
          </p>
          <p>
            <strong>3. Código mutuo al concretarse.</strong> Tú y esa persona
            tendrán el mismo código corto. Compárenlo al llegar: si no
            coincide, no abras la puerta.
          </p>
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-600 bg-surface px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            Registrar otro hogar
          </button>
          <Link
            href="/hogares"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Ver hogares de paso
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
          placeholder="Ej. María Fernanda López"
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
        hint="Solo se usa para coordinar el hospedaje. Nunca se publica."
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
        label="Documento (opcional)"
        htmlFor="documento"
        error={errFor("documento")}
        hint="Opcional. Nunca se publica ni se comparte."
      >
        <input
          id="documento"
          name="documento"
          type="text"
          inputMode="numeric"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="Ej. 1023456789"
          aria-invalid={!!errFor("documento")}
          aria-describedby={errFor("documento") ? "documento-error" : undefined}
          className={inputClass(!!errFor("documento"))}
        />
      </Field>

      <Field label="Ciudad o municipio" htmlFor="ciudad" required error={errFor("ciudad")}>
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
        label="Zona o barrio (opcional)"
        htmlFor="zona"
        error={errFor("zona")}
        hint="Da contexto sin revelar tu dirección. Ej. 'Cerca al centro'."
      >
        <input
          id="zona"
          name="zona"
          type="text"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          placeholder="Ej. Chipre"
          aria-invalid={!!errFor("zona")}
          aria-describedby={errFor("zona") ? "zona-error" : undefined}
          className={inputClass(!!errFor("zona"))}
        />
      </Field>

      <Field
        label="Dirección (opcional)"
        htmlFor="direccion"
        error={errFor("direccion")}
        hint="Solo se comparte con la persona que llegue a tu casa."
      >
        <input
          id="direccion"
          name="direccion"
          type="text"
          autoComplete="street-address"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Ej. Cra. 23 #45-12, apto 301"
          aria-invalid={!!errFor("direccion")}
          aria-describedby={errFor("direccion") ? "direccion-error" : undefined}
          className={inputClass(!!errFor("direccion"))}
        />
      </Field>

      <Field
        label="¿Cuántas personas puedes hospedar?"
        htmlFor="capacidad"
        required
        error={errFor("capacidad")}
      >
        <input
          id="capacidad"
          name="capacidad"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          placeholder="Ej. 3"
          aria-invalid={!!errFor("capacidad")}
          aria-describedby={errFor("capacidad") ? "capacidad-error" : undefined}
          className={inputClass(!!errFor("capacidad"))}
        />
      </Field>

      {/* A quiénes puede recibir: chips multiselección (incluye mascotas) */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          ¿A quiénes puedes recibir?{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="mt-0.5 text-xs text-foreground/55">
          Selecciona todas las que apliquen. Las mascotas también cuentan.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HOGAR_ACEPTA.map((v) => {
            const checked = acepta.has(v);
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
                  name="acepta"
                  value={v}
                  checked={checked}
                  onChange={() => toggleAcepta(v)}
                  className="size-4 accent-brand-600"
                />
                <span className="leading-tight">{ACEPTA_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("acepta") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("acepta")}
          </p>
        )}
      </fieldset>

      {/* Qué ofrece además del techo: chips opcionales */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          ¿Qué ofreces además del techo?
        </legend>
        <p className="mt-0.5 text-xs text-foreground/55">
          Opcional. Ayuda a que te encuentre la familia adecuada.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HOGAR_OFRECE.map((v) => {
            const checked = ofrece.has(v);
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
                  name="ofrece"
                  value={v}
                  checked={checked}
                  onChange={() => toggleOfrece(v)}
                  className="size-4 accent-brand-600"
                />
                <span className="leading-tight">{OFRECE_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("ofrece") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("ofrece")}
          </p>
        )}
      </fieldset>

      {/* Duración: radio */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          ¿Por cuánto tiempo puedes hospedar?{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {HOGAR_DURACIONES.map((v) => {
            const checked = duracion === v;
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
                  type="radio"
                  name="duracion"
                  value={v}
                  checked={checked}
                  onChange={() => setDuracion(v)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span>{DURACION_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("duracion") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("duracion")}
          </p>
        )}
      </fieldset>

      {/* Convivencia: obligatorio y con explicación del porqué */}
      <fieldset className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          ¿Quiénes viven en tu casa?{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="mt-0.5 text-xs text-foreground/60">
          Lo preguntamos por transparencia y por la seguridad de quien llega:
          una persona puede elegir el tipo de hogar donde se sienta segura.
          Nunca se publican nombres, solo la categoría.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONVIVENCIAS.map((v) => {
            const checked = convivencia === v;
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
                  type="radio"
                  name="convivencia"
                  value={v}
                  checked={checked}
                  onChange={() => setConvivencia(v)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span>{CONVIVENCIA_LABELS[v]}</span>
              </label>
            );
          })}
        </div>
        {errFor("convivencia") && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("convivencia")}
          </p>
        )}
      </fieldset>

      <Field
        label="Notas (opcional)"
        htmlFor="notas"
        error={errFor("notas")}
        hint="Lo que quieras aclarar: horarios, escaleras, alergias, etc."
      >
        <textarea
          id="notas"
          name="notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej. Tenemos un cuarto libre con dos camas. Hay un gato en casa."
          aria-invalid={!!errFor("notas")}
          aria-describedby={errFor("notas") ? "notas-error" : undefined}
          className={inputClass(!!errFor("notas")) + " resize-y"}
        />
      </Field>

      {/* Aviso de privacidad, destacado y justo antes del envío */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        <span aria-hidden="true" className="mt-px shrink-0 text-base">
          🔒
        </span>
        <p className="leading-relaxed">
          <strong className="font-semibold">
            Tu nombre, teléfono, documento y dirección nunca se publican.
          </strong>{" "}
          Tu hogar aparece en la lista solo con la información general que
          declaraste aquí.
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
            <span aria-hidden="true">🏠</span>
            Ofrecer mi hogar
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
