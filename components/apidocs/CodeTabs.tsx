"use client";

import { useId, useState } from "react";
import CodeBlock from "./CodeBlock";

/*
 * Pestañas de ejemplos de código (ej. curl / JavaScript / filtro).
 * -------------------------------------------------------------------------
 * Wrapper accesible alrededor de <CodeBlock>: una fila de pestañas con
 * roles ARIA (tablist/tab) y el bloque activo debajo. La navegación por
 * teclado funciona porque las pestañas son <button> reales.
 */

export interface CodeSample {
  /** Identificador estable de la pestaña. */
  id: string;
  /** Texto visible de la pestaña (ej. "cURL"). */
  label: string;
  /** Etiqueta de lenguaje para la barra del bloque. */
  lang: string;
  /** Código a mostrar. */
  code: string;
}

export default function CodeTabs({ samples }: { samples: CodeSample[] }) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(samples[0]?.id);
  const current = samples.find((s) => s.id === activeId) ?? samples[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div
        role="tablist"
        aria-label="Ejemplos de código"
        className="flex gap-1 overflow-x-auto border-b border-border bg-surface-muted/60 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {samples.map((s) => {
          const selected = s.id === current?.id;
          return (
            <button
              key={s.id}
              id={`${baseId}-tab-${s.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${s.id}`}
              onClick={() => setActiveId(s.id)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-surface text-brand-700 shadow-sm ring-1 ring-border"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {current && (
        <div
          id={`${baseId}-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${current.id}`}
          className="p-3 sm:p-4"
        >
          {/* Reusa el bloque con copiar; key fuerza re-montaje al cambiar de pestaña */}
          <CodeBlock
            key={current.id}
            code={current.code}
            lang={current.lang}
            label={current.label}
          />
        </div>
      )}
    </div>
  );
}
