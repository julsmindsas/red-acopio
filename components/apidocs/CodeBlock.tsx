"use client";

import { useState } from "react";

/*
 * Bloque de código con botón "copiar".
 * -------------------------------------------------------------------------
 * - Fondo oscuro constante (slate) para que el código sea siempre legible,
 *   independientemente del tema claro/oscuro de la app.
 * - El botón usa `navigator.clipboard` y da feedback inline ("Copiado ✓");
 *   nunca usa alert/confirm. Si el navegador bloquea el portapapeles, la UI
 *   no se rompe (degrada en silencio).
 * - `lang`/`label` son solo etiquetas visuales: no hacemos resaltado de
 *   sintaxis para no añadir dependencias.
 */

export default function CodeBlock({
  code,
  lang = "bash",
  label,
}: {
  code: string;
  /** Etiqueta corta del lenguaje (bash, json, js…). */
  lang?: string;
  /** Texto opcional que reemplaza a `lang` en la barra superior. */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Revierte el estado para que el botón vuelva a "Copiar".
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Portapapeles no disponible (contexto inseguro o permiso denegado):
      // no interrumpimos al usuario; simplemente no confirmamos la copia.
      setCopied(false);
    }
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-lg shadow-slate-950/20">
      {/* Barra superior estilo "ventana": puntos decorativos + etiqueta + copiar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="ml-1 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label ?? lang}
          </span>
        </span>

        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          aria-label={copied ? "Código copiado" : "Copiar código al portapapeles"}
        >
          <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      {/* Código: scroll horizontal en pantallas pequeñas para no romper el layout */}
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed text-slate-100">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
