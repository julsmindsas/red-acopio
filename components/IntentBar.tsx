"use client";

import { track } from "@vercel/analytics";
import { INTENTS } from "@/lib/intents";
import type { PointKind } from "@/lib/types";

/*
 * Entrada por intención: la primera decisión, en un solo toque.
 * -------------------------------------------------------------------------
 * Quien abre esta app acaba de vivir un sismo. No está para leer tres grupos
 * de filtros y decidir combinaciones: necesita decir qué le pasa y ver puntos.
 *
 * Cada botón traduce una necesidad en lenguaje humano ("busco dónde dormir")
 * al filtro técnico correspondiente (`kind`). Los filtros finos siguen ahí,
 * plegados, para quien los quiera.
 */

/** ¿Este conjunto de tipos activos corresponde exactamente a esta intención? */
function isActive(kinds: PointKind[], selected: Set<PointKind>): boolean {
  return (
    selected.size === kinds.length && kinds.every((k) => selected.has(k))
  );
}

export default function IntentBar({
  kindFilter,
  onPick,
  onClear,
}: {
  kindFilter: Set<PointKind>;
  onPick: (kinds: PointKind[]) => void;
  onClear: () => void;
}) {
  const anyActive = kindFilter.size > 0;

  return (
    <section aria-label="¿Qué necesitas?" className="flex flex-col gap-2">
      <h2 className="px-0.5 text-sm font-bold text-foreground">
        ¿Qué necesitas?
      </h2>

      <div className="grid gap-2 sm:grid-cols-3">
        {INTENTS.map((intent) => {
          const active = isActive(intent.kinds, kindFilter);
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => {
                onPick(intent.kinds);
                track("intencion", { intencion: intent.id });
              }}
              aria-pressed={active}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                active
                  ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "border-border bg-surface text-foreground hover:border-brand-400 hover:bg-brand-50"
              }`}
            >
              <span aria-hidden="true" className="text-3xl leading-none">
                {intent.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold leading-tight">
                  {intent.title}
                </span>
                <span
                  className={`block text-xs leading-tight ${
                    active ? "text-white/80" : "text-foreground/55"
                  }`}
                >
                  {intent.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {anyActive && (
        <button
          type="button"
          onClick={onClear}
          className="self-start rounded-lg px-1.5 py-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Ver todos los puntos
        </button>
      )}
    </section>
  );
}
