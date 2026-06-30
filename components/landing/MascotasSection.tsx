import Link from "next/link";

/*
 * Sección "También para las mascotas" (Server Component — sin interactividad).
 * Recuerda que los animales también son víctimas de los terremotos y conduce a
 * los centros que reciben donaciones para ellos vía deep-link.
 *
 * Panel de marca esmeralda (oscuro en ambos esquemas, igual que ApiTeaser) con
 * un toque cálido en ámbar (accent), patita 🐾, lista de insumos como chips y un
 * CTA hacia /mapa?material=mascotas que precarga el filtro de "mascotas".
 */

// Insumos más útiles para los animales afectados (emoji + etiqueta accesible).
const INSUMOS = [
  { emoji: "🍖", label: "Comida" },
  { emoji: "💊", label: "Medicinas veterinarias" },
  { emoji: "🧳", label: "Guacales / transportadoras" },
  { emoji: "🛏️", label: "Cobijas" },
  { emoji: "🦮", label: "Correas" },
] as const;

export default function MascotasSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-7 text-white shadow-xl sm:p-10">
        {/* Malla cartográfica muy sutil, coherente con el resto de paneles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-map-grid opacity-[0.12]"
        />
        {/* Halo cálido en ámbar para dar calidez sin perder confianza */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-accent-400/20 blur-3xl"
        />
        {/* Huella decorativa enorme y difuminada de fondo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 right-4 text-[10rem] leading-none opacity-10 select-none sm:text-[14rem]"
        >
          🐾
        </span>

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* ---- Texto + CTA ---- */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-50 ring-1 ring-white/15">
              <span aria-hidden="true">🐾</span>
              Ellas también nos necesitan
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              También para las mascotas
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-100/90 sm:text-base">
              Los animales también son víctimas de los terremotos. Muchas
              familias evacuaron con sus mascotas y hoy necesitan ayuda para
              cuidarlas. Tu donación también puede llegar a ellas.
            </p>

            <Link
              href="/mapa?material=mascotas"
              className="group mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-brand-800 shadow-lg shadow-brand-950/20 transition-colors hover:bg-brand-50"
            >
              <span aria-hidden="true">🐾</span>
              Ver centros para mascotas
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          {/* ---- Lista de insumos como chips ---- */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-100/70">
              Qué puedes donar
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {INSUMOS.map((item) => (
                <li
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur"
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
