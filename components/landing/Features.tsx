/*
 * Cuadrícula de características (Server Component).
 * Comunica de un vistazo por qué la herramienta es útil y confiable.
 * Mobile-first: 1 columna en móvil, 2 en tablet, 3 en escritorio.
 */

const FEATURES = [
  {
    emoji: "📍",
    title: "Tu ubicación, tu mapa",
    text: "Con un toque, ordena los centros por cercanía y ve cuál tienes más a la mano.",
  },
  {
    emoji: "🛡️",
    title: "Datos verificados",
    text: "Los centros oficiales de acopiove.org aparecen claramente marcados como verificados.",
  },
  {
    emoji: "📱",
    title: "Pensado para el móvil",
    text: "Rápido y ligero. Funciona bien incluso con conexión lenta o datos limitados.",
  },
  {
    emoji: "🧭",
    title: "Filtra por material",
    text: "Alimentos, agua, medicamentos, aseo, ropa… encuentra dónde llevar justo lo que tienes.",
  },
  {
    emoji: "🔌",
    title: "API abierta",
    text: "Todos los datos disponibles en JSON, sin llave, para quien quiera construir encima.",
  },
  {
    emoji: "🙌",
    title: "De la comunidad",
    text: "¿Conoces un centro? Recomiéndalo en segundos y ayuda a que más gente lo encuentre.",
  },
] as const;

export default function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Una herramienta simple, hecha con cuidado
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
          Todo lo necesario para donar con confianza, sin fricción y desde el
          teléfono.
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li
            key={f.title}
            className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-xl ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100"
            >
              {f.emoji}
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
              {f.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
