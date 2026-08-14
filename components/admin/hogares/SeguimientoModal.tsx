"use client";

import { useState } from "react";
import type { Seguimiento, SolicitudHogar } from "@/lib/hogares/types";
import type { Result } from "../api";
import { Banner, Field, Spinner, inputClass } from "../ui";
import ModalShell from "./ModalShell";
import { HITO_LABELS } from "./meta";

/*
 * Modal para registrar una llamada de seguimiento.
 * ------------------------------------------------------------------------
 * El hito llega precalculado desde el panel (`seguimientoPendiente` decide si
 * toca la de 48h o la de 7 días; si ninguna, se registra como "otro"). El
 * equipo solo responde dos cosas: ¿están bien ambas partes? y ¿qué se
 * encontró? Al guardar se envía la lista COMPLETA de seguimientos (los
 * previos + el nuevo): el contrato del PATCH es reemplazo total.
 *
 * Si "bien" es falso, el panel resalta la solicitud en tono de alerta: la
 * nota se vuelve obligatoria de facto para dejar rastro de qué pasa.
 */
export default function SeguimientoModal({
  solicitud,
  hito,
  onClose,
  onSubmit,
}: {
  solicitud: SolicitudHogar;
  hito: "48h" | "7d" | "otro";
  onClose: () => void;
  /** Hace el PATCH { seguimientos } con la lista completa. */
  onSubmit: (seguimientos: Seguimiento[]) => Promise<Result<SolicitudHogar>>;
}) {
  const [bien, setBien] = useState(true);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Si algo anda mal, no aceptamos una llamada sin nota: el siguiente turno
    // del equipo necesita saber QUÉ está mal para poder actuar.
    if (!bien && nota.trim() === "") {
      setError("Describe qué está pasando; es clave para actuar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const nuevo: Seguimiento = {
      fecha: new Date().toISOString(),
      hito,
      bien,
      nota: nota.trim(),
    };
    const res = await onSubmit([...solicitud.seguimientos, nuevo]);

    if (res.ok) {
      // El panel cierra el modal y muestra el aviso de éxito.
      return;
    }
    setSubmitting(false);
    setError(res.error);
  };

  return (
    <ModalShell
      title={`${HITO_LABELS[hito]} · ${solicitud.nombre}`}
      onClose={onClose}
      busy={submitting}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col">
        <div className="flex flex-col gap-4 px-5 py-4">
          {error && <Banner tone="error">{error}</Banner>}

          <p className="text-sm text-foreground/70">
            Llama a {solicitud.nombre} y al hogar anfitrión y registra aquí lo
            que encuentres. La llamada quedará con fecha de hoy.
          </p>

          {/* ¿Están bien ambas partes? */}
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">
              ¿Están bien ambas partes?
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  bien
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-border bg-surface text-foreground/70 hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="bien"
                  checked={bien}
                  onChange={() => setBien(true)}
                  className="sr-only"
                />
                <span aria-hidden="true">✅</span> Sí, todo bien
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  !bien
                    ? "border-red-400 bg-red-50 text-red-800"
                    : "border-border bg-surface text-foreground/70 hover:border-red-300"
                }`}
              >
                <input
                  type="radio"
                  name="bien"
                  checked={!bien}
                  onChange={() => setBien(false)}
                  className="sr-only"
                />
                <span aria-hidden="true">🚨</span> Algo anda mal
              </label>
            </div>
          </fieldset>

          {!bien && (
            <Banner tone="error">
              La solicitud quedará resaltada en alerta hasta que se resuelva.
            </Banner>
          )}

          <Field
            label="Nota de la llamada"
            htmlFor="seguimiento-nota"
            required={!bien}
            hint={
              bien
                ? "Opcional: cualquier detalle útil para la próxima llamada."
                : "Obligatoria: describe qué está pasando."
            }
          >
            <textarea
              id="seguimiento-nota"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={500}
              className={inputClass() + " resize-y"}
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
              "Guardar llamada"
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
