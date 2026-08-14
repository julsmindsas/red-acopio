/*
 * "Cómo funciona" de Hogares de Paso (Server Component, contenido estático).
 *
 * Dos columnas espejadas — ofrezco casa / necesito hogar — con los mismos tres
 * pasos: registro → verificación telefónica → conexión con código mutuo. Que
 * ambos lados vean el proceso completo es deliberado: quien abre su casa
 * entiende que a la otra persona también la verificaron, y viceversa. Esa
 * simetría es la que genera confianza para dormir bajo el techo de un extraño.
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
    titulo: "Te llamamos para verificar",
    detalle:
      "El equipo coordinador te llama, valida tu documento y confirma lo que declaraste. Solo entonces tu hogar aparece en la lista.",
  },
  {
    titulo: "Te conectamos con un código de seguridad",
    detalle:
      "Cuando haya una familia compatible, tú y ella reciben el mismo código corto. Al llegar lo comparan: si no coincide, nadie entra.",
  },
];

const PASOS_NECESITO: Paso[] = [
  {
    titulo: "Cuéntanos quiénes son",
    detalle:
      "Cuántas personas, si van con mascotas y con qué tipo de hogar te sentirías segura. Tu solicitud nunca se publica: solo la ve el equipo.",
  },
  {
    titulo: "Te llamamos para verificar",
    detalle:
      "El equipo confirma tu situación por teléfono y busca un hogar verificado que respete tus preferencias. Nunca proponemos uno que las viole.",
  },
  {
    titulo: "Llegas con un código de seguridad",
    detalle:
      "Tú y el anfitrión reciben el mismo código corto. Al llegar lo comparan: si no coincide, no entres y llámanos de inmediato.",
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
        Nadie llega a una casa sin que el equipo haya verificado a las dos
        partes. Tres pasos, sean cuales sean tus zapatos:
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
