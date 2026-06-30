import type { Center } from "@/lib/types";
import CountUp from "./CountUp";

/*
 * Métricas en vivo de la red (Server Component).
 * Calcula los números reales a partir de los centros cargados en el servidor
 * (listAllCenters) y los muestra con un contador animado en el cliente.
 *
 * Métricas:
 *   - Centros de acopio: total de puntos en el mapa (oficiales + comunidad).
 *   - Ciudades y municipios: localidades distintas con al menos un centro.
 *   - Verificados: centros confirmados contra la red oficial (acopiove.org).
 */

export default function Stats({ centers }: { centers: Center[] }) {
  const total = centers.length;
  const verificados = centers.filter((c) => c.status === "verificado").length;
  const ciudades = new Set(
    centers
      .map((c) => c.city?.trim())
      .filter((city): city is string => Boolean(city)),
  ).size;

  const items = [
    {
      value: total,
      emoji: "📍",
      label: "Centros de acopio",
      hint: "puntos activos en el mapa",
    },
    {
      value: ciudades,
      emoji: "🏙️",
      label: "Ciudades y municipios",
      hint: "con cobertura en Colombia",
    },
    {
      value: verificados,
      emoji: "🛡️",
      label: "Verificados",
      hint: "confirmados con acopiove.org",
    },
  ];

  return (
    <section
      aria-labelledby="stats-title"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
    >
      <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="stats-title"
            className="text-sm font-semibold uppercase tracking-wider text-foreground/55"
          >
            La red, en números
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Datos en vivo
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={
                i > 0 ? "sm:border-l sm:border-border sm:pl-6" : undefined
              }
            >
              <dt className="flex items-center gap-2 text-sm font-medium text-foreground/70">
                <span aria-hidden="true" className="text-base">
                  {it.emoji}
                </span>
                {it.label}
              </dt>
              <dd className="mt-2 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
                <CountUp value={it.value} />
              </dd>
              <p className="mt-1 text-xs text-foreground/50">{it.hint}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
