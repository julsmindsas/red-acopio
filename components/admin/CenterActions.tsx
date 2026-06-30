"use client";

import { useState } from "react";
import type { Center } from "@/lib/types";
import { Spinner } from "./ui";

/*
 * Acciones de fila para un centro local: "Editar" y "Eliminar".
 * ------------------------------------------------------------------------
 * La eliminación usa confirmación INLINE (nunca window.confirm, que bloquea el
 * hilo y no es accesible): al pulsar "Eliminar" el control se transforma en
 * "¿Eliminar? Sí / Cancelar". Cada instancia gestiona su propio estado de
 * confirmación, de modo que confirmar un centro no afecta a los demás.
 */
export default function CenterActions({
  center,
  busy,
  onEdit,
  onDelete,
  align = "start",
}: {
  center: Center;
  /** `true` mientras hay una acción en curso sobre ESTE centro. */
  busy: boolean;
  onEdit: (center: Center) => void;
  onDelete: (id: string) => void;
  /** Alineación horizontal de los botones (en tabla conviene "end"). */
  align?: "start" | "end";
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 ${
          align === "end" ? "justify-end" : ""
        }`}
        role="group"
        aria-label={`Confirmar eliminación de ${center.name}`}
      >
        <span className="text-xs font-medium text-foreground/70">
          ¿Eliminar?
        </span>
        <button
          type="button"
          onClick={() => onDelete(center.id)}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Spinner className="size-3.5 text-white" /> : null}
          Sí, eliminar
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        align === "end" ? "justify-end" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onEdit(center)}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-600 bg-brand-50 px-3 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 disabled:opacity-60"
      >
        <span aria-hidden="true">✏️</span>
        Editar
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-300 bg-surface px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <span aria-hidden="true">🗑️</span>
        Eliminar
      </button>
    </div>
  );
}
