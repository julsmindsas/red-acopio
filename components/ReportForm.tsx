"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import MapView from "@/components/map/MapView";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_EMOJI,
  MATERIAL_LABELS,
} from "@/lib/constants";
import { centerInputSchema, formatZodErrors } from "@/lib/validation";
import type { ApiError, MaterialCategory } from "@/lib/types";

/*
 * Formulario para recomendar un nuevo centro de acopio.
 * ------------------------------------------------------------------------
 * - Validación en cliente con `centerInputSchema.safeParse` (mismo esquema que
 *   usa la API en el servidor), mostrando errores por campo.
 * - Ubicación: botón "Usar mi ubicación" (geolocalización) + inputs numéricos
 *   de lat/lng. Cuando hay coordenadas válidas, un mini-mapa reutiliza <MapView>
 *   como vista previa del punto reportado.
 * - Envío: POST a /api/centers. Maneja 201 (gracias + pendiente de revisión) y
 *   400 (pinta los errores por campo que devuelve la API).
 */

const EMPTY_ERRORS: Record<string, string[]> = {};

export default function ReportForm() {
  // --- Estado del formulario ----------------------------------------------
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [materials, setMaterials] = useState<Set<MaterialCategory>>(new Set());
  const [schedule, setSchedule] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [notes, setNotes] = useState("");

  // --- Estado de envío / errores ------------------------------------------
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]>>(EMPTY_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const errFor = (field: string): string | undefined =>
    fieldErrors[field]?.[0];

  // --- Coordenadas para el mini-mapa --------------------------------------
  const coords = useMemo(() => {
    const latN = Number(lat);
    const lngN = Number(lng);
    const valid =
      lat !== "" &&
      lng !== "" &&
      !Number.isNaN(latN) &&
      !Number.isNaN(lngN) &&
      latN >= -90 &&
      latN <= 90 &&
      lngN >= -180 &&
      lngN <= 180;
    return valid ? { lat: latN, lng: lngN } : null;
  }, [lat, lng]);

  // --- Acciones -----------------------------------------------------------
  const toggleMaterial = useCallback((m: MaterialCategory) => {
    setMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }, []);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoMsg("Tu navegador no permite geolocalización.");
      return;
    }
    setGeoMsg("Obteniendo tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoMsg("Ubicación tomada. Ajústala si el punto no es exacto.");
      },
      (err) => {
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Ingresa las coordenadas manualmente."
            : "No pudimos obtener tu ubicación. Ingresa las coordenadas manualmente.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setAddress("");
    setPhone("");
    setMaterials(new Set());
    setSchedule("");
    setLat("");
    setLng("");
    setNotes("");
    setFieldErrors(EMPTY_ERRORS);
    setFormError(null);
    setGeoMsg(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Construimos el objeto a validar. lat/lng se convierten a número; si están
    // vacíos pasamos `undefined` para que zod muestre "Ubica el centro en el mapa.".
    const candidate = {
      name,
      address,
      phone: phone.trim() === "" ? null : phone,
      materials: Array.from(materials),
      schedule,
      lat: lat === "" ? undefined : Number(lat),
      lng: lng === "" ? undefined : Number(lng),
      notes: notes.trim() === "" ? null : notes,
    };

    // Validación en cliente (mismo esquema que el servidor).
    const result = centerInputSchema.safeParse(candidate);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      // Lleva el foco al primer error desplazando hacia arriba el formulario.
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFieldErrors(EMPTY_ERRORS);
    setSubmitting(true);
    try {
      const res = await fetch("/api/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (res.status === 201) {
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
        "No pudimos enviar tu recomendación en este momento. Inténtalo más tarde.",
      );
    } catch {
      setFormError(
        "Hubo un problema de conexión. Revisa tu internet e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Pantalla de éxito ---------------------------------------------------
  if (success) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <span aria-hidden="true" className="text-4xl">
          🙌
        </span>
        <h2 className="mt-2 text-xl font-bold text-brand-900">
          ¡Gracias por tu recomendación!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-brand-800">
          Recibimos el centro que recomendaste. Quedará{" "}
          <strong>pendiente de revisión</strong> y, una vez verificado,
          aparecerá en el mapa para que más personas puedan donar.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-600 bg-surface px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            Recomendar otro centro
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Volver al mapa
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

      <Field
        label="Nombre del centro"
        htmlFor="name"
        required
        error={errFor("name")}
      >
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Parroquia San José"
          aria-invalid={!!errFor("name")}
          aria-describedby={errFor("name") ? "name-error" : undefined}
          className={inputClass(!!errFor("name"))}
        />
      </Field>

      <Field
        label="Dirección"
        htmlFor="address"
        required
        error={errFor("address")}
      >
        <input
          id="address"
          name="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej. Cra. 70 #45-12, Laureles, Medellín"
          aria-invalid={!!errFor("address")}
          aria-describedby={errFor("address") ? "address-error" : undefined}
          className={inputClass(!!errFor("address"))}
        />
      </Field>

      <Field
        label="Teléfono (opcional)"
        htmlFor="phone"
        error={errFor("phone")}
        hint="Ayuda a que la gente confirme antes de ir."
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej. +57 300 123 4567"
          aria-invalid={!!errFor("phone")}
          aria-describedby={errFor("phone") ? "phone-error" : undefined}
          className={inputClass(!!errFor("phone"))}
        />
      </Field>

      {/* Materiales (mínimo 1) */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          ¿Qué materiales recibe?{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="mt-0.5 text-xs text-foreground/55">
          Selecciona al menos uno.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MATERIAL_CATEGORIES.map((m) => {
            const checked = materials.has(m);
            return (
              <label
                key={m}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  checked
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-border bg-surface text-foreground/80 hover:border-brand-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="materials"
                  value={m}
                  checked={checked}
                  onChange={() => toggleMaterial(m)}
                  className="size-4 accent-brand-600"
                />
                <span aria-hidden="true">{MATERIAL_EMOJI[m]}</span>
                <span className="leading-tight">{MATERIAL_LABELS[m]}</span>
              </label>
            );
          })}
        </div>
        {errFor("materials") && (
          <p className="mt-1.5 text-xs font-medium text-red-600">
            {errFor("materials")}
          </p>
        )}
      </fieldset>

      <Field
        label="Horario de atención"
        htmlFor="schedule"
        required
        error={errFor("schedule")}
      >
        <input
          id="schedule"
          name="schedule"
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="Ej. Lun-Vie 8:00am-5:00pm"
          aria-invalid={!!errFor("schedule")}
          aria-describedby={errFor("schedule") ? "schedule-error" : undefined}
          className={inputClass(!!errFor("schedule"))}
        />
      </Field>

      {/* Ubicación: geolocalización + coordenadas + mini-mapa */}
      <fieldset className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Ubicación{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </legend>

        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-600 bg-brand-50 px-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100"
        >
          <span aria-hidden="true">📡</span>
          Usar mi ubicación
        </button>
        {geoMsg && (
          <p className="mt-2 text-xs text-foreground/70" aria-live="polite">
            {geoMsg}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Latitud" htmlFor="lat" required error={errFor("lat")}>
            <input
              id="lat"
              name="lat"
              type="number"
              inputMode="decimal"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="6.2476"
              aria-invalid={!!errFor("lat")}
              aria-describedby={errFor("lat") ? "lat-error" : undefined}
              className={inputClass(!!errFor("lat"))}
            />
          </Field>
          <Field label="Longitud" htmlFor="lng" required error={errFor("lng")}>
            <input
              id="lng"
              name="lng"
              type="number"
              inputMode="decimal"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="-75.5658"
              aria-invalid={!!errFor("lng")}
              aria-describedby={errFor("lng") ? "lng-error" : undefined}
              className={inputClass(!!errFor("lng"))}
            />
          </Field>
        </div>

        {/* Vista previa en mini-mapa cuando hay coordenadas válidas */}
        {coords && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-foreground/60">
              Vista previa del punto recomendado:
            </p>
            <div className="h-48 overflow-hidden rounded-xl border border-border">
              <MapView
                markers={[
                  {
                    id: "nuevo",
                    lat: coords.lat,
                    lng: coords.lng,
                    title: name.trim() || "Centro recomendado",
                    status: "reportado",
                  },
                ]}
                userLocation={null}
                selectedId="nuevo"
                center={coords}
                zoom={15}
                className="h-full w-full"
              />
            </div>
          </div>
        )}
      </fieldset>

      <Field
        label="Notas (opcional)"
        htmlFor="notes"
        error={errFor("notes")}
        hint="Detalles útiles: si piden algo en particular, si hay parqueadero, etc."
      >
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Reciben donaciones en la entrada principal."
          aria-invalid={!!errFor("notes")}
          aria-describedby={errFor("notes") ? "notes-error" : undefined}
          className={inputClass(!!errFor("notes")) + " resize-y"}
        />
      </Field>

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
            <span aria-hidden="true">📨</span>
            Enviar recomendación
          </>
        )}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes / utilidades de presentación                                */
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
