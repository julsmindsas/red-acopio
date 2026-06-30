/*
 * "Cómo ayudar" en 3 pasos (Server Component).
 * Tarjetas con número de paso e icono, conectadas por una línea sutil en
 * escritorio que refuerza la idea de secuencia: encontrar → confirmar → donar.
 */

const STEPS = [
  {
    n: "1",
    emoji: "🔎",
    title: "Encuentra",
    text: "Abre el mapa y ubica el centro de acopio más cercano. Activa tu ubicación para ordenarlos por cercanía a ti.",
  },
  {
    n: "2",
    emoji: "✅",
    title: "Confirma",
    text: "Mira si está verificado y llama antes de ir: confirma el horario y qué materiales están recibiendo hoy.",
  },
  {
    n: "3",
    emoji: "🤝",
    title: "Dona",
    text: "Lleva tu donación al punto. Cada aporte llega a las familias afectadas por los terremotos en Venezuela.",
  },
] as const;

export default function Steps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ayudar toma minutos
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
          Tres pasos simples entre tú y una donación que llega a donde se
          necesita.
        </p>
      </div>

      <ol className="relative mt-10 grid gap-6 sm:grid-cols-3">
        {/* Línea conectora (solo escritorio), a la altura de los iconos */}
        <div
          aria-hidden="true"
          className="absolute inset-x-12 top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent sm:block"
        />

        {STEPS.map((s) => (
          <li
            key={s.n}
            className="relative flex flex-col items-center rounded-3xl border border-border bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-md shadow-brand-600/30 ring-4 ring-surface"
            >
              {s.emoji}
            </span>
            <span className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-600">
              Paso {s.n}
            </span>
            <h3 className="mt-1 text-lg font-bold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {s.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
