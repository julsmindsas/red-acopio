import Link from "next/link";

/*
 * Sección "Hogares de paso" (Server Component — sin interactividad).
 * Mensaje doble en una sola sección porque son las dos caras del mismo puente:
 * quien abre su casa y quien se quedó sin la suya. Separarlos en dos secciones
 * haría que cada mitad viera solo su lado y no entendiera el mecanismo.
 *
 * Identidad propia: panel cálido sobre el acento ámbar (a diferencia del panel
 * esmeralda de MascotasSection) porque aquí el mensaje es hogar y calor humano,
 * no logística. Mantiene la malla cartográfica y los rounded-3xl del resto.
 *
 * La mención a la verificación del equipo no es letra pequeña: es lo que hace
 * que alguien se atreva a abrir su puerta o a dormir en casa de un extraño.
 */

export default function HogaresSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 p-7 text-white shadow-xl sm:p-10">
        {/* Malla cartográfica sutil, coherente con los demás paneles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-map-grid opacity-[0.12]"
        />
        {/* Halo esmeralda: el guiño inverso al halo ámbar de MascotasSection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-brand-400/25 blur-3xl"
        />
        {/* Casita decorativa enorme y difuminada de fondo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 right-4 text-[10rem] leading-none opacity-10 select-none sm:text-[14rem]"
        >
          🏡
        </span>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            <span aria-hidden="true">🏡</span>
            Hogares de paso
          </span>

          <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            Una casa que se abre, una familia que respira
          </h2>

          {/* ---- Las dos caras del puente ---- */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <h3 className="text-base font-bold">Abre tu casa</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                Si tienes una habitación o un espacio disponible, puedes
                hospedar temporalmente a una familia damnificada — con sus
                mascotas, si puedes recibirlas. Tú decides cuántas personas y
                por cuánto tiempo.
              </p>
              <Link
                href="/hogares/ofrecer"
                className="group mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-accent-800 shadow-lg shadow-black/10 transition-colors hover:bg-accent-50"
              >
                <span aria-hidden="true">🤝</span>
                Ofrecer mi casa
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <h3 className="text-base font-bold">Encuentra un hogar de paso</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                Si tu casa quedó inhabitable, hay familias listas para
                recibirte mientras te recuperas. También hay hogares que
                aceptan mascotas: no tienes que dejar a nadie atrás.
              </p>
              <Link
                href="/hogares"
                className="group mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-accent-800 shadow-lg shadow-black/10 transition-colors hover:bg-accent-50"
              >
                <span aria-hidden="true">🏡</span>
                Ver hogares disponibles
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Confianza: la razón por la que este puente funciona */}
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80">
            <span aria-hidden="true">🛡️</span> Todo pasa por la verificación
            del equipo coordinador: nadie ve tu teléfono ni tu dirección, y al
            emparejar ambas partes reciben un código para confirmarse al
            llegar.
          </p>
        </div>
      </div>
    </section>
  );
}
