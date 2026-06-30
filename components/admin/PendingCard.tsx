"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import MaterialChips from "@/components/MaterialChips";
import type { Center } from "@/lib/types";
import { Spinner } from "./ui";

/*
 * Tarjeta de una recomendación ciudadana pendiente (status === "reportado").
 * ------------------------------------------------------------------------
 * Muestra los datos clave del centro reportado y las tres decisiones del admin:
 *  - "Aprobar como verificado"  -> PATCH status: "verificado"
 *  - "Marcar sin verificar"     -> PATCH status: "sin_verificar"
 *  - "Eliminar"                 -> DELETE (con confirmación inline)
 *
 * La lógica de red vive en el Dashboard; aquí solo invocamos los callbacks y
 * mostramos el estado de ocupación (`busy`).
 */
export default function PendingCard({
  center,
  busy,
  onApprove,
  onUnverify,
  onDelete,
}: {
  center: Center;
  busy: boolean;
  onApprove: (id: string) => void;
  onUnverify: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
      {/* Cabecera: nombre + insignia de estado */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {center.name}
          </h3>
          <p className="mt-0.5 text-sm text-foreground/70">{center.address}</p>
        </div>
        <StatusBadge status={center.status} />
      </div>

      {/* Datos secundarios */}
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <Detail term="Horario" value={center.schedule} />
        <Detail term="Teléfono" value={center.phone} />
        {(center.city || center.country) && (
          <Detail
            term="Ubicación"
            value={[center.city, center.country].filter(Boolean).join(", ")}
          />
        )}
        <Detail term="Coordenadas" value={`${center.lat}, ${center.lng}`} />
        {center.notes && <Detail term="Notas" value={center.notes} wide />}
        {center.source && <Detail term="Origen" value={center.source} wide />}
      </dl>

      {/* Materiales */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Materiales
        </p>
        <MaterialChips materials={center.materials} />
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sky-200/70 pt-3">
        <button
          type="button"
          onClick={() => onApprove(center.id)}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Spinner className="size-4 text-white" /> : <span aria-hidden="true">✅</span>}
          Aprobar como verificado
        </button>
        <button
          type="button"
          onClick={() => onUnverify(center.id)}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-accent-400 bg-accent-50 px-4 text-sm font-semibold text-accent-900 transition-colors hover:bg-accent-100 disabled:opacity-60"
        >
          <span aria-hidden="true">🕓</span>
          Marcar sin verificar
        </button>

        {/* Eliminar con confirmación inline */}
        {confirming ? (
          <span
            className="inline-flex flex-wrap items-center gap-2"
            role="group"
            aria-label={`Confirmar eliminación de ${center.name}`}
          >
            <span className="text-xs font-medium text-foreground/70">
              ¿Eliminar este reporte?
            </span>
            <button
              type="button"
              onClick={() => onDelete(center.id)}
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
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-300 bg-surface px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <span aria-hidden="true">🗑️</span>
            Eliminar
          </button>
        )}
      </div>
    </li>
  );
}

/** Par término/valor del bloque de datos. `wide` ocupa toda la fila. */
function Detail({
  term,
  value,
  wide = false,
}: {
  term: string;
  value: string | null | undefined;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        {term}
      </dt>
      <dd className="text-foreground/85">
        {value && value.trim() !== "" ? (
          value
        ) : (
          <span className="text-foreground/40">—</span>
        )}
      </dd>
    </div>
  );
}
