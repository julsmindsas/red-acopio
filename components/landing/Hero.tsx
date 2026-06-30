import Link from "next/link";

/*
 * Hero de la portada (Server Component — sin interactividad).
 * Estructura:
 *   - Fondo decorativo: halo cálido + malla cartográfica difuminada con máscara.
 *   - Columna de texto: eyebrow con banderas, titular fuerte, subtítulo y 2 CTAs.
 *   - Columna visual: un "mapa" estilizado con la ruta Colombia → Venezuela,
 *     pines de bandera y chips de materiales flotando (puro CSS/SVG, sin imágenes).
 */

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fondo decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-map-grid opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -right-24 top-24 size-72 rounded-full bg-accent-300/25 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
        {/* ---- Columna de texto ---- */}
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
            <span aria-hidden="true">🇨🇴</span>
            <span aria-hidden="true" className="text-brand-400">
              →
            </span>
            <span aria-hidden="true">🇻🇪</span>
            <span>Ayuda para los terremotos en Venezuela · 2026</span>
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Dónde donar para{" "}
            <span className="text-brand-600">Venezuela</span>,{" "}
            <br className="hidden sm:block" />
            desde Colombia
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            Un mapa{" "}
            <strong className="font-semibold text-foreground">
              abierto y verificado
            </strong>{" "}
            de centros de acopio en Medellín y toda Colombia. Encuentra el punto
            más cercano, confírmalo y dona — en minutos.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mapa"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-brand-600/40"
            >
              <span aria-hidden="true">🗺️</span>
              Ver el mapa
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <Link
              href="/reportar"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-base font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              <span aria-hidden="true">＋</span>
              Recomendar un centro
            </Link>
          </div>

          {/* Señales de confianza */}
          <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-foreground/55">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Datos de acopiove.org
            </span>
            <span aria-hidden="true">·</span>
            <span>Aportes de la comunidad</span>
            <span aria-hidden="true">·</span>
            <span>100% open source (MIT)</span>
          </p>
        </div>

        {/* ---- Columna visual ---- */}
        <HeroMap />
      </div>
    </section>
  );
}

/** "Mapa" estilizado con la ruta de ayuda y pines (decorativo). */
function HeroMap() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md animate-rise [animation-delay:120ms]">
      {/* Panel del mapa */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-xl shadow-brand-900/5">
        <div className="absolute inset-0 bg-map-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/70 via-transparent to-accent-50/60" />

        {/* Ruta discontinua Colombia → Venezuela */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 size-full"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M108 280 C 170 210, 240 250, 300 120"
            stroke="var(--color-brand-500)"
            strokeWidth="3"
            strokeDasharray="2 12"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>

        {/* Pin de origen (Colombia) y destino (Venezuela) */}
        <PinBadge flag="🇨🇴" label="Colombia" className="left-[27%] top-[70%]" />
        <PinBadge
          flag="🇻🇪"
          label="Venezuela"
          pulse
          className="left-[75%] top-[30%]"
        />

        {/* Insignia "En vivo" */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-border backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          En vivo
        </div>
      </div>

      {/* Chips de materiales flotantes (sobresalen del panel) */}
      <FloatingChip
        emoji="🥫"
        label="Alimentos"
        className="-left-3 top-10 animate-float"
      />
      <FloatingChip
        emoji="💧"
        label="Agua"
        className="-right-3 top-1/2 animate-float-slow"
      />
      <FloatingChip
        emoji="💊"
        label="Medicamentos"
        className="bottom-6 left-4 animate-float-slow"
      />
    </div>
  );
}

/** Pin de ubicación con bandera y etiqueta. `pulse` añade un anillo animado. */
function PinBadge({
  flag,
  label,
  className = "",
  pulse = false,
}: {
  flag: string;
  label: string;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${className}`}
    >
      <span className="relative flex size-12 items-center justify-center rounded-full bg-surface text-2xl shadow-lg ring-2 ring-brand-500/40">
        {pulse && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400/40" />
        )}
        <span aria-hidden="true" className="relative">
          {flag}
        </span>
      </span>
      <span className="mt-1 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-semibold text-background">
        {label}
      </span>
    </div>
  );
}

/** Chip flotante de material (decorativo). */
function FloatingChip({
  emoji,
  label,
  className = "",
}: {
  emoji: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg shadow-brand-900/5 ${className}`}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
    </div>
  );
}
