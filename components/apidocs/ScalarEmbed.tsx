"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Referencia interactiva de la API (visor OpenAPI) embebida con Scalar vía CDN.
 * -------------------------------------------------------------------------
 * Scalar (standalone) funciona así: se coloca un <script id="api-reference"
 * data-url="/api/openapi.json"> donde queremos que se monte, y luego se carga
 * el script del CDN, que detecta ese elemento y renderiza la referencia.
 *
 * Lo hacemos en cliente, dentro de useEffect, para:
 *   - inyectar los <script> al montar y limpiarlos al desmontar (evita fugas
 *     y nodos duplicados al navegar entre páginas);
 *   - NO bloquear el render: si el CDN falla (onerror) mostramos un fallback
 *     con enlace directo al spec.
 */

const SPEC_URL = "/api/openapi.json";
const SCALAR_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

type Status = "loading" | "ready" | "failed";

export default function ScalarEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Script de configuración: Scalar lo busca por id y monta la referencia
    //    en su lugar (dentro de nuestro contenedor).
    const config = document.createElement("script");
    config.id = "api-reference";
    config.setAttribute("data-url", SPEC_URL);
    // Configuración mínima y coherente con la marca.
    config.setAttribute(
      "data-configuration",
      JSON.stringify({ theme: "default", layout: "modern", hideClientButton: false }),
    );
    container.appendChild(config);

    // 2) Script del CDN que activa el visor.
    const cdn = document.createElement("script");
    cdn.src = SCALAR_CDN;
    cdn.async = true;
    cdn.onload = () => setStatus("ready");
    cdn.onerror = () => setStatus("failed");
    document.body.appendChild(cdn);

    // Salvaguarda: si en 12 s el CDN no cargó, mostramos el fallback igualmente.
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "failed" : s));
    }, 12000);

    return () => {
      window.clearTimeout(timer);
      cdn.remove();
      config.remove();
      // Limpia cualquier nodo que Scalar haya inyectado dentro del contenedor.
      // `replaceChildren()` sin argumentos vacía el nodo de forma segura.
      container.replaceChildren();
    };
  }, []);

  return (
    <div>
      {/* Aviso de carga mientras el CDN responde */}
      {status === "loading" && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-5 text-sm text-foreground/60"
          aria-live="polite"
        >
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600"
          />
          Cargando la referencia interactiva…
        </div>
      )}

      {/* Fallback accesible si el visor no carga: enlace directo al spec */}
      {status === "failed" && (
        <div className="rounded-2xl border border-accent-300 bg-accent-50 px-4 py-5 text-sm text-accent-900">
          <p className="font-semibold">
            No se pudo cargar el visor interactivo.
          </p>
          <p className="mt-1 text-accent-900/80">
            Puedes abrir la especificación OpenAPI directamente o importarla en tu
            herramienta favorita (Postman, Insomnia, Swagger UI…).
          </p>
          <a
            href={SPEC_URL}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
          >
            Abrir openapi.json
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}

      {/* Contenedor donde Scalar monta la referencia. min-h evita "saltos". */}
      <div
        ref={containerRef}
        className={
          status === "ready"
            ? "min-h-[60vh] overflow-hidden rounded-2xl border border-border bg-surface"
            : "sr-only"
        }
      />
    </div>
  );
}
