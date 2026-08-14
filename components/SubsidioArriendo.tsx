/*
 * Subsidio de arriendo para familias con vivienda inhabitable.
 *
 * El Gobierno ya activó esta ayuda, pero está repartida en notas de prensa y
 * casi nadie sabe que existe ni cómo pedirla. Traducirla a tres pasos es de lo
 * más útil que puede hacer esta app: da techo por meses, no por una noche.
 *
 * Server Component: son datos estáticos, sin JavaScript de cliente.
 */

/** Los tres pasos, en el orden real del trámite. */
const PASOS = [
  {
    n: "1",
    titulo: "Reporta el daño de tu vivienda",
    detalle:
      "En la Alcaldía o en la oficina de Gestión del Riesgo de tu municipio. En Chocó, también en la Gobernación.",
  },
  {
    n: "2",
    titulo: "Pide quedar en el censo de damnificados",
    detalle:
      "El requisito indispensable es aparecer en el Registro Único de Damnificados. Si no estás en el censo, no llega la ayuda.",
  },
  {
    n: "3",
    titulo: "Espera la visita del inspector",
    detalle:
      "Un técnico evalúa la vivienda y valida que necesitas trasladarte mientras la reparan o reconstruyen.",
  },
];

export default function SubsidioArriendo() {
  return (
    <section
      aria-labelledby="subsidio-titulo"
      className="rounded-2xl border-2 border-brand-300 bg-brand-50/60 p-5"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
        Si tu casa quedó inhabitable
      </p>
      <h2
        id="subsidio-titulo"
        className="mt-1 text-xl font-bold leading-tight text-foreground sm:text-2xl"
      >
        El Gobierno paga tu arriendo mientras reparan tu vivienda
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
        Es para hogares cuya casa sufrió colapso, pérdida total o daños que la
        dejaron inhabitable. No es un albergue: es plata para que arriendes donde
        tú elijas.
      </p>

      <ol className="mt-4 flex flex-col gap-3">
        {PASOS.map((paso) => (
          <li key={paso.n} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
            >
              {paso.n}
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">
                {paso.titulo}
              </span>
              <span className="block text-sm leading-relaxed text-foreground/70">
                {paso.detalle}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="tel:018000113200"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
        >
          <span aria-hidden="true">📞</span>
          Llamar a la UNGRD: 01 8000 113200
        </a>
        <a
          href="https://portal.gestiondelriesgo.gov.co/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-300 bg-surface px-5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100"
        >
          Portal de la UNGRD ↗
        </a>
      </div>

      {/* Honestidad sobre lo que todavía no se sabe: prometer un monto que
          nadie ha publicado haría que la gente planeara con una cifra falsa. */}
      <p className="mt-4 border-t border-brand-200 pt-3 text-xs leading-relaxed text-foreground/60">
        El Gobierno aún no ha publicado el monto, la duración ni la fecha de
        apertura de solicitudes. Lo que sí puedes hacer hoy es{" "}
        <strong className="font-semibold text-foreground/80">
          reportar el daño y quedar en el censo
        </strong>
        : sin eso, la ayuda no llega cuando salga. En Risaralda además hay tres
        meses de alivio en el pago de servicios públicos.
      </p>
    </section>
  );
}
