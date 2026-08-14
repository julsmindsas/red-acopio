"use client";

import { useEffect, useId } from "react";

/*
 * Cascarón de modal reutilizado por Emparejar y Seguimiento.
 * ------------------------------------------------------------------------
 * Replica el comportamiento del modal de edición de centros para que todo el
 * panel se sienta igual: hoja inferior en móvil, tarjeta centrada en
 * escritorio, cierre con Escape o clic en el telón, scroll del fondo
 * bloqueado y `role="dialog"` accesible.
 */
export default function ModalShell({
  title,
  onClose,
  /** Si hay una acción en curso, el modal no se deja cerrar. */
  busy = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const titleId = useId();

  // Bloquea el scroll del fondo y habilita el cierre con Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // Cierra solo al hacer clic en el telón (no dentro del panel).
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2
            id={titleId}
            className="truncate text-base font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="-mr-1 shrink-0 rounded-full p-2 text-foreground/60 transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
