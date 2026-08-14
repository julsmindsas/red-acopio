/*
 * "Cómo funciona" de Hogares de Paso (Server Component, contenido estático).
 *
 * Dos columnas espejadas — ofrezco casa / necesito hogar — con tres pasos cada
 * una. El copy es honesto a propósito: Red de Acopio es una plataforma de
 * intermediación que protege los datos, NO un equipo que llama y verifica
 * personas. Prometer llamadas que nadie hará destruiría la confianza que este
 * puente necesita.
 */

interface Paso {
  titulo: string;
  detalle: string;
}

const PASOS_OFREZCO: Paso[] = [
  {
    titulo: "Registra tu casa",
    detalle:
      "Cuéntanos a quiénes puedes recibir, por cuánto tiempo y quiénes viven contigo. Tus datos personales nunca se publican.",
  },
  {
    titulo: "Tu hogar queda publicado al instante",
    detalle:
      "Aparece en la lista solo con la información general: ciudad, zona, capacidad, a quiénes recibes y quiénes viven contigo. Nada más.",
  },
  {
    titulo: "Se concreta con un código de confirmación",
    detalle:
      "Cuando una familia coincide contigo, las dos partes comparten contacto y un mismo código corto. Al llegar lo comparan: si no coincide, nadie entra.",
  },
];

const PASOS_NECESITO: Paso[] = [
  {
    titulo: "Cuéntanos quiénes son",
    detalle:
      "Cuántas personas, si van con mascotas y con qué tipo de hogar te sentirías segura. Tu solicitud es privada: nunca aparece publicada.",
  },
  {
    titulo: "Explora los hogares y solicita",
    detalle:
      "Mira la lista, fíjate en quiénes viven en cada casa y solicita el hogar que te sirva. Tus preferencias de convivencia se respetan siempre.",
  },
  {
    titulo: "Llega con el código de confirmación",
    detalle:
      "Al concretarse el hospedaje, tú y el anfitrión tendrán el mismo código corto. Al llegar compárenlo: si no coincide, no entres.",
  },
];

/** Una columna de pasos numerados; el mismo patrón visual de SubsidioArriendo. */
function Columna({
  etiqueta,
  emoji,
  pasos,
}: {
  etiqueta: string;
  emoji: string;
  pasos: Paso[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
        <span aria-hidden="true">{emoji}</span>
        {etiqueta}
      </h3>
      <ol className="mt-4 flex flex-col gap-4">
        {pasos.map((paso, i) => (
          <li key={paso.titulo} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
            >
              {i + 1}
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
    </div>
  );
}

export default function ComoFunciona() {
  return (
    <section aria-labelledby="como-funciona-titulo">
      <h2
        id="como-funciona-titulo"
        className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
      >
        Cómo funciona
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
        Red de Acopio es el puente: protege tus datos y conecta a las dos
        partes, pero no verifica personas — la decisión final siempre es tuya.
        Tres pasos, sean cuales sean tus zapatos:
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Columna etiqueta="Ofrezco mi casa" emoji="🔑" pasos={PASOS_OFREZCO} />
        <Columna
          etiqueta="Necesito un hogar"
          emoji="🧳"
          pasos={PASOS_NECESITO}
        />
      </div>
    </section>
  );
}
