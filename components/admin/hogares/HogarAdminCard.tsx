"use client";

import { useState } from "react";
import type { Hogar } from "@/lib/hogares/types";
import {
  ACEPTA_LABELS,
  CONVIVENCIA_LABELS,
  DURACION_LABELS,
  OFRECE_LABELS,
} from "@/lib/hogares/types";
import { Spinner } from "../ui";
import { Dato, TelefonoLink, ValorOpcional } from "./meta";

/*
 * Tarjeta de un hogar pendiente de verificación.
 * ------------------------------------------------------------------------
 * Este panel es la herramienta del equipo coordinador: aquí SÍ se muestran
 * los datos privados (nombre, teléfono, documento, dirección), porque la
 * verificación consiste precisamente en llamar y validar el documento.
 * La barrera de privacidad vive en la API pública, no en esta pantalla.
 *
 * Acciones: verificar, rechazar y eliminar (con confirmación inline).
 */
export default function HogarAdminCard({
  hogar,
  busy,
  onVerificar,
  onRechazar,
  onEliminar,
}: {
  hogar: Hogar;
  busy: boolean;
  onVerificar: (id: string) => void;
  onRechazar: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-2xl border border-accent-200 bg-accent-50/50 p-4">
      {/* Cabecera: anfitrión + teléfono para llamar de una */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {hogar.nombre}
          </h3>
          <p className="mt-0.5 text-sm text-foreground/70">
            <TelefonoLink telefono={hogar.telefono} />
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-accent-300 bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-900">
          🕓 Por verificar
        </span>
      </div>

      {/* Datos privados + oferta del hogar */}
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <Dato term="Documento">
          <ValorOpcional value={hogar.documento} />
        </Dato>
        <Dato term="Dirección">
          <ValorOpcional value={hogar.direccion} />
        </Dato>
        <Dato term="Ciudad / zona">
          {hogar.ciudad}
          {hogar.zona ? ` · ${hogar.zona}` : ""}
        </Dato>
        <Dato term="Capacidad">
          {hogar.capacidad} {hogar.capacidad === 1 ? "persona" : "personas"} ·{" "}
          {DURACION_LABELS[hogar.duracion]}
        </Dato>
        <Dato term="Recibe" wide>
          {hogar.acepta.map((a) => ACEPTA_LABELS[a]).join(", ")}
        </Dato>
        <Dato term="Ofrece" wide>
          {hogar.ofrece.length > 0 ? (
            hogar.ofrece.map((o) => OFRECE_LABELS[o]).join(", ")
          ) : (
            <span className="text-foreground/40">Solo el espacio</span>
          )}
        </Dato>
        <Dato term="Convivencia" wide>
          {CONVIVENCIA_LABELS[hogar.convivencia]}
        </Dato>
        {hogar.notas && (
          <Dato term="Notas" wide>
            {hogar.notas}
          </Dato>
        )}
      </dl>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-accent-200/70 pt-3">
        <button
          type="button"
          onClick={() => onVerificar(hogar.id)}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Spinner className="size-4 text-white" />
          ) : (
            <span aria-hidden="true">✓</span>
          )}
          Verificar
        </button>
        <button
          type="button"
          onClick={() => onRechazar(hogar.id)}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-300 bg-surface px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          <span aria-hidden="true">✗</span>
          Rechazar
        </button>

        {/* Eliminar con confirmación inline, como en PendingCard */}
        {confirming ? (
          <span
            className="inline-flex flex-wrap items-center gap-2"
            role="group"
            aria-label={`Confirmar eliminación del hogar de ${hogar.nombre}`}
          >
            <span className="text-xs font-medium text-foreground/70">
              ¿Eliminar este hogar?
            </span>
            <button
              type="button"
              onClick={() => onEliminar(hogar.id)}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? <Spinner className="size-4 text-white" /> : null}
              Sí, eliminar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            <span aria-hidden="true">🗑️</span>
            Eliminar
          </button>
        )}
      </div>
    </li>
  );
}
