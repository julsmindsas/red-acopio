/*
 * Ayudas y canales oficiales publicados por las entidades responsables.
 *
 * Sale de las "pistas" que detecta el monitor `scripts/sources/portales-oficiales.ts`:
 * publicaciones oficiales que NO son un punto en el mapa (no tienen dirección a
 * la que llegar) pero que resuelven algo concreto — a qué cuenta consignar, a
 * qué correo escribir para reportar una afectación. Enterrarlas en una nota de
 * prensa equivale a que no existan.
 *
 * Regla: cada dato lleva el enlace a la publicación oficial de donde salió, y
 * lo que no se sabe se dice. Server Component sin JavaScript de cliente, igual
 * que el resto de /ayuda.
 */

interface Ayuda {
  emoji: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  /** Datos textuales que la persona necesita copiar o marcar. */
  datos: { termino: string; valor: string }[];
  /** Aclaración honesta: por qué algo es como es, o qué NO cubre. */
  aclaracion?: string;
  fuente: { url: string; entidad: string };
}

const AYUDAS: Ayuda[] = [
  {
    // Va primero porque tiene fecha de vencimiento: alguien que salga a llevar
    // una donación en carro sin saber esto se devuelve o lo multan.
    emoji: "🚗",
    etiqueta: "Pereira",
    titulo: "Restricción de carros en la ciudad",
    descripcion:
      "La Alcaldía prohibió la circulación de carros particulares mientras se atiende la emergencia. Si vas a mover ayuda, revisa antes cómo llegar.",
    datos: [
      {
        termino: "Vigencia",
        valor:
          "Desde el miércoles 12 a medianoche hasta el lunes siguiente a las 8:00 p. m.",
      },
      {
        termino: "Sí pueden circular",
        valor: "Taxis, motocicletas y las rutas habilitadas de Megabús",
      },
      {
        termino: "Excepciones",
        valor:
          "Personal médico y de salud, apoyo logístico con ayudas humanitarias, brigadas de rescate identificadas y prensa",
      },
      { termino: "Motos", valor: "El pico y placa se mantiene con normalidad" },
    ],
    aclaracion:
      "Los vehículos que transportan ayuda humanitaria hacia el CROE (Avenida de las Américas con calle 95) no tienen restricción de movilidad: puedes ir directo a entregar.",
    fuente: {
      url: "https://www.risaralda.gov.co/publicaciones/164029/informacion-importante-terremoto/",
      entidad: "Gobernación de Risaralda y Alcaldía de Pereira",
    },
  },
  {
    emoji: "💳",
    etiqueta: "Quindío",
    titulo: "Cuenta oficial para donar dinero",
    descripcion:
      "La Gobernación del Quindío habilitó una cuenta para recibir donaciones en dinero tras la declaratoria de calamidad pública.",
    datos: [
      { termino: "Banco", valor: "Bancolombia — cuenta de ahorros" },
      { termino: "Número", valor: "069 000 764 93" },
      { termino: "Titular", valor: "Cuerpo de Bomberos Voluntarios de Salento" },
    ],
    // Sin esta explicación, ver una cuenta a nombre de unos bomberos y no de la
    // Gobernación parece una estafa y la gente —con razón— no consigna.
    aclaracion:
      "La cuenta no está a nombre del departamento a propósito: la Gobernación explicó que usar una cuenta propia obligaría a trámites administrativos que retrasarían la entrega, así que canalizó las donaciones por el Cuerpo de Bomberos Voluntarios de Salento, con respaldo del Gobierno del Quindío.",
    fuente: {
      url: "https://quindio.gov.co/habilitan-cuenta-bancaria-para-recibir-donaciones-en-dinero-tras-declaratoria-de-calamidad-publica-en-el-quindio",
      entidad: "Gobernación del Quindío",
    },
  },
  {
    emoji: "📋",
    etiqueta: "Armenia",
    titulo: "Reportar tu afectación ante la Alcaldía",
    descripcion:
      "La Alcaldía entrega mercados, agua, kits de cocina, colchonetas y cobijas de la campaña nacional 'Colombia, un solo corazón'. La entrega va por barrios y por el albergue del Coliseo del Sur; para que tu caso entre, repórtalo por estos canales.",
    datos: [
      { termino: "Correo", valor: "servicioalcliente@armenia.gov.co" },
      { termino: "Presencial", valor: "CAM, Carrera 16 #15-28, Armenia" },
      {
        termino: "Horario",
        valor: "Lunes a viernes, 8:00–11:50 a. m. y 2:00–5:50 p. m.",
      },
      {
        termino: "En línea",
        valor: "Radica una PQRSDF en el portal de la Alcaldía",
      },
    ],
    aclaracion:
      "Los barrios que ya recibieron entregas son Manuela Beltrán, La Patria, Nuevo Armenia, Las Brisas, Santa Elena y el Centro de Evangelización Santa Laura Montoya. Que tu barrio no aparezca no significa que quedes por fuera: por eso conviene reportar.",
    fuente: {
      url: "https://www.armenia.gov.co/damnificados-de-armenia-recibieron-ayuda-humanitaria",
      entidad: "Alcaldía de Armenia",
    },
  },
];

export default function AyudasOficiales() {
  return (
    <section aria-labelledby="ayudas-oficiales-titulo">
      <h2
        id="ayudas-oficiales-titulo"
        className="text-xl font-bold tracking-tight text-foreground"
      >
        Ayudas oficiales que no están en el mapa
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground/70">
        No son puntos a los que se pueda llegar, sino trámites y cuentas que las
        entidades publicaron en sus portales. Cada uno enlaza a su fuente.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {AYUDAS.map((a) => (
          <article
            key={a.titulo}
            className="flex flex-col rounded-2xl border border-border bg-surface p-5"
          >
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-500/30">
              <span aria-hidden="true">{a.emoji}</span>
              {a.etiqueta}
            </span>

            <h3 className="mt-2.5 text-base font-bold leading-tight text-foreground">
              {a.titulo}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
              {a.descripcion}
            </p>

            <dl className="mt-3 flex flex-col gap-1.5 rounded-xl bg-surface-muted p-3.5">
              {a.datos.map((d) => (
                <div key={d.termino} className="text-sm">
                  <dt className="inline font-semibold text-foreground/60">
                    {d.termino}:{" "}
                  </dt>
                  {/* Seleccionable y en monoespaciada: se copia a mano desde el
                      celular, sin depender de JavaScript. */}
                  <dd className="inline select-all font-medium text-foreground">
                    {d.valor}
                  </dd>
                </div>
              ))}
            </dl>

            {a.aclaracion && (
              <p className="mt-3 border-l-2 border-accent-400 pl-3 text-xs leading-relaxed text-foreground/60">
                {a.aclaracion}
              </p>
            )}

            <a
              href={a.fuente.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto pt-3 text-xs font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Publicación de {a.fuente.entidad} ↗
            </a>
          </article>
        ))}
      </div>

      {/* Hallazgo negativo, pero útil: mucha gente busca un portal donde
          inscribirse sola en el censo. No existe, y decirlo ahorra horas. */}
      <p className="mt-4 rounded-2xl border border-accent-300 bg-accent-500/10 p-4 text-sm leading-relaxed text-foreground/75">
        <strong className="font-semibold text-foreground">
          Sobre el Registro Único de Damnificados:
        </strong>{" "}
        no hay una página donde inscribirte por tu cuenta. El sistema de la
        UNGRD es interno y lo diligencian los funcionarios, así que se entra al
        censo por la Alcaldía o la oficina de Gestión del Riesgo de tu
        municipio. Ese censo es el requisito para el subsidio de arriendo y
        para las demás ayudas.
      </p>
    </section>
  );
}
