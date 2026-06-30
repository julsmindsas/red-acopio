"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Center, CenterPatch, MaterialCategory } from "@/lib/types";
import { STATUS_META, VERIFICATION_STATUSES } from "@/lib/constants";
import type { Result } from "./api";
import { Banner, Field, MaterialPicker, Spinner, inputClass } from "./ui";

/*
 * Modal de edición de un centro local.
 * ------------------------------------------------------------------------
 * Precarga todos los campos editables y, al guardar, construye un `CenterPatch`
 * y delega el PATCH en `onSubmit` (provisto por el Dashboard). Si el servidor
 * responde 400 con `{ error, fields }`, pintamos los errores por campo y el
 * modal permanece abierto.
 *
 * Accesibilidad del diálogo:
 *  - role="dialog" + aria-modal + título asociado (aria-labelledby).
 *  - Bloquea el scroll del fondo y cierra con Escape o clic en el telón.
 *  - Enfoca el primer campo al abrir.
 * En móvil se comporta como hoja inferior (bottom sheet); en escritorio, como
 * tarjeta centrada.
 */
export default function EditCenterForm({
  center,
  onClose,
  onSubmit,
}: {
  center: Center;
  onClose: () => void;
  onSubmit: (patch: CenterPatch) => Promise<Result<Center>>;
}) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // --- Estado del formulario (precargado desde el centro) -----------------
  const [name, setName] = useState(center.name);
  const [address, setAddress] = useState(center.address);
  const [phone, setPhone] = useState(center.phone ?? "");
  const [materials, setMaterials] = useState<Set<MaterialCategory>>(
    () => new Set(center.materials),
  );
  const [schedule, setSchedule] = useState(center.schedule);
  const [lat, setLat] = useState(String(center.lat));
  const [lng, setLng] = useState(String(center.lng));
  const [city, setCity] = useState(center.city ?? "");
  const [country, setCountry] = useState(center.country ?? "");
  const [notes, setNotes] = useState(center.notes ?? "");
  const [status, setStatus] = useState(center.status);

  // --- Estado de envío / errores ------------------------------------------
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errFor = (field: string): string | undefined => fieldErrors[field]?.[0];

  // Bloquea el scroll del fondo mientras el modal está abierto y enfoca el
  // primer campo. Cierra con Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // `submitting` se lee dentro del handler; lo incluimos para que el cierre
    // por Escape respete el envío en curso.
  }, [onClose, submitting]);

  const toggleMaterial = (m: MaterialCategory) => {
    setMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validaciones mínimas en cliente para lat/lng (deben ser números reales).
    const latN = Number(lat);
    const lngN = Number(lng);
    const localErrors: Record<string, string[]> = {};
    if (lat.trim() === "" || !Number.isFinite(latN))
      localErrors.lat = ["Ingresa una latitud válida."];
    if (lng.trim() === "" || !Number.isFinite(lngN))
      localErrors.lng = ["Ingresa una longitud válida."];
    if (materials.size === 0)
      localErrors.materials = ["Selecciona al menos un material."];

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setFormError("Revisa los campos marcados.");
      return;
    }

    // Construimos el patch con todos los campos editables. Los opcionales de
    // texto vacío se envían como `null` (limpiar el dato).
    const patch: CenterPatch = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() === "" ? null : phone.trim(),
      materials: Array.from(materials),
      schedule: schedule.trim(),
      lat: latN,
      lng: lngN,
      city: city.trim() === "" ? null : city.trim(),
      country: country.trim() === "" ? null : country.trim(),
      notes: notes.trim() === "" ? null : notes.trim(),
      status,
    };

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const res = await onSubmit(patch);

    if (res.ok) {
      // El Dashboard cierra el modal y muestra el aviso de éxito.
      return;
    }

    // Error: mostramos errores por campo (si los hay) y un mensaje general.
    setSubmitting(false);
    setFieldErrors(res.fields ?? {});
    setFormError(res.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // Cierra solo al hacer clic en el telón (no dentro del panel).
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-2xl"
      >
        {/* Cabecera fija */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2
            id={titleId}
            className="truncate text-base font-bold tracking-tight text-foreground"
          >
            Editar centro
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="-mr-1 shrink-0 rounded-full p-2 text-foreground/60 transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {formError && <Banner tone="error">{formError}</Banner>}

            <Field
              label="Nombre"
              htmlFor="edit-name"
              required
              error={errFor("name")}
            >
              <input
                ref={firstFieldRef}
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errFor("name")}
                className={inputClass(!!errFor("name"))}
              />
            </Field>

            <Field
              label="Dirección"
              htmlFor="edit-address"
              required
              error={errFor("address")}
            >
              <input
                id="edit-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={!!errFor("address")}
                className={inputClass(!!errFor("address"))}
              />
            </Field>

            <Field
              label="Teléfono"
              htmlFor="edit-phone"
              error={errFor("phone")}
              hint="Déjalo vacío si no se conoce."
            >
              <input
                id="edit-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errFor("phone")}
                className={inputClass(!!errFor("phone"))}
              />
            </Field>

            <MaterialPicker
              selected={materials}
              onToggle={toggleMaterial}
              error={errFor("materials")}
            />

            <Field
              label="Horario"
              htmlFor="edit-schedule"
              required
              error={errFor("schedule")}
            >
              <input
                id="edit-schedule"
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Ej. Lun-Vie 8:00am-5:00pm"
                aria-invalid={!!errFor("schedule")}
                className={inputClass(!!errFor("schedule"))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Latitud"
                htmlFor="edit-lat"
                required
                error={errFor("lat")}
              >
                <input
                  id="edit-lat"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  aria-invalid={!!errFor("lat")}
                  className={inputClass(!!errFor("lat"))}
                />
              </Field>
              <Field
                label="Longitud"
                htmlFor="edit-lng"
                required
                error={errFor("lng")}
              >
                <input
                  id="edit-lng"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  aria-invalid={!!errFor("lng")}
                  className={inputClass(!!errFor("lng"))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciudad" htmlFor="edit-city" error={errFor("city")}>
                <input
                  id="edit-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Medellín"
                  aria-invalid={!!errFor("city")}
                  className={inputClass(!!errFor("city"))}
                />
              </Field>
              <Field
                label="País"
                htmlFor="edit-country"
                error={errFor("country")}
              >
                <input
                  id="edit-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ej. Colombia"
                  aria-invalid={!!errFor("country")}
                  className={inputClass(!!errFor("country"))}
                />
              </Field>
            </div>

            <Field
              label="Estado de verificación"
              htmlFor="edit-status"
              required
              error={errFor("status")}
            >
              <select
                id="edit-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Center["status"])
                }
                aria-invalid={!!errFor("status")}
                className={inputClass(!!errFor("status"))}
              >
                {VERIFICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Notas"
              htmlFor="edit-notes"
              error={errFor("notes")}
              hint="Información útil para quien dona."
            >
              <textarea
                id="edit-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-invalid={!!errFor("notes")}
                className={inputClass(!!errFor("notes")) + " resize-y"}
              />
            </Field>
          </div>

          {/* Pie fijo con acciones */}
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Spinner className="size-4 text-white" />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
