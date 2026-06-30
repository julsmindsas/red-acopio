import Link from "next/link";
import CopyButton from "./CopyButton";

/*
 * Sección "API abierta para desarrolladores" (Server Component).
 * Panel oscuro de marca con un terminal estilizado: comando curl listo para
 * copiar y CTA a la documentación (/api-docs). El botón de copiar es el único
 * trozo cliente (CopyButton).
 */

const SNIPPET = "curl https://red-acopio-two.vercel.app/api/v1/centers";

export default function ApiTeaser() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-7 text-white shadow-xl sm:p-10">
        {/* Malla cartográfica muy sutil sobre el fondo oscuro */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-map-grid opacity-[0.12]"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Texto */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/15">
              🔌 Para desarrolladores
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Una API abierta con los datos de la red
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-100/85 sm:text-base">
              Construye sobre los mismos datos que mueven la ayuda: centros,
              ubicaciones y materiales en JSON, sin llave y gratis. Úsalos en tu
              bot, panel o mapa.
            </p>
            <Link
              href="/api-docs"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Ver la documentación
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Terminal */}
          <div className="rounded-2xl bg-brand-950/60 p-1.5 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-red-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <CopyButton
                text={SNIPPET}
                className="rounded-md px-2 py-1 text-xs font-semibold text-brand-100 transition-colors hover:bg-white/10"
              />
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/30 px-4 py-3 font-mono text-xs leading-relaxed text-brand-50 sm:text-sm">
              <code>
                <span className="text-brand-300">$ </span>
                {SNIPPET}
              </code>
            </pre>
            <p className="px-4 py-2.5 font-mono text-[11px] leading-relaxed text-brand-200/70">
              → 200 OK · application/json
              <br />
              {"[ { id, name, lat, lng, materials, status… } ]"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
