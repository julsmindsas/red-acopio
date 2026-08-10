/**
 * Canales oficiales de ayuda para la emergencia activa.
 *
 * MISMA DISCIPLINA QUE LOS CENTROS: cada canal declara su fuente y si pudo
 * confirmarse en el dominio oficial de la organización. Un teléfono o una
 * cuenta equivocados en una emergencia no son un detalle cosmético — desvían
 * dinero y hacen perder tiempo a quien busca a un familiar.
 *
 * Regla aplicada al cargar estos datos (10-ago-2026):
 *   - `verified: true`  → el dato se leyó en el sitio web oficial de la propia
 *                         organización.
 *   - `verified: false` → el dato lo publicó la prensa citando a la
 *                         organización, pero NO se pudo confirmar en su sitio.
 *                         La UI lo muestra con advertencia explícita.
 *
 * NO se publica ningún número de cuenta bancaria: al momento de cargar estos
 * datos, distintos medios reportaban números de cuenta DISTINTOS para la Cruz
 * Roja Colombiana y ninguno aparecía en su sitio oficial. En su lugar se enlaza
 * la pasarela de donación oficial, que no puede transcribirse mal.
 */

/** Para qué sirve el canal: ordena la UI por urgencia real. */
export type HelpChannelPurpose =
  | "emergencia" // salvar vidas ahora
  | "buscar_personas" // reunificación familiar
  | "donar_dinero"
  | "informacion";

export interface HelpChannel {
  id: string;
  /** Organización responsable del canal. */
  org: string;
  label: string;
  purpose: HelpChannelPurpose;
  /** Qué resuelve, en una línea. */
  description: string;
  /** Valor mostrado (teléfono, correo, dominio). */
  value: string;
  /** Destino del enlace: `tel:`, `mailto:`, `https:` o `https://wa.me/`. */
  href: string;
  /** `true` solo si se confirmó en el sitio oficial de la organización. */
  verified: boolean;
  /** URL pública desde donde se tomó el dato. */
  source: string;
}

/**
 * Aviso de cabecera sobre la forma de ayudar.
 *
 * Es la corrección más valiosa que puede dar esta app: en los primeros días de
 * un desastre, las donaciones en especie mal dirigidas saturan la logística que
 * se necesita para salvar vidas. Redactado como principio humanitario general
 * —que es lo que es— y no atribuido a un comunicado concreto de esta
 * emergencia, que al cargar estos datos aún no se había publicado.
 */
export const HELP_NOTICE = {
  title: "En los primeros días, el dinero rinde más que la ropa",
  body:
    "Las organizaciones humanitarias priorizan los aportes en dinero durante la " +
    "fase inicial de una emergencia: permiten comprar cerca de la zona lo que " +
    "realmente falta, sin ocupar los camiones y las bodegas que se necesitan " +
    "para el rescate. Si vas a donar en especie, confirma antes con el punto " +
    "qué está recibiendo — y revisa si ya está saturado.",
} as const;

export const HELP_CHANNELS: HelpChannel[] = [
  {
    id: "linea-123",
    org: "Emergencias Colombia",
    label: "Línea 123",
    purpose: "emergencia",
    description:
      "Emergencias, personas atrapadas, heridos y rescate. Gratuita desde cualquier teléfono.",
    value: "123",
    href: "tel:123",
    verified: true,
    source: "https://portal.gestiondelriesgo.gov.co/",
  },
  // Líneas nacionales de emergencia difundidas para este sismo. Marcar cada una
  // por servicio importa: quien necesita una ambulancia pierde tiempo si solo
  // conoce el 123 y la central está saturada.
  {
    id: "linea-125",
    org: "Emergencias Colombia",
    label: "Ambulancias — 125",
    purpose: "emergencia",
    description: "Solicitud de ambulancia y atención prehospitalaria.",
    value: "125",
    href: "tel:125",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/08/10/sismo-de-74-en-colombia-estas-son-las-lineas-telefonicas-de-atencion-de-emergencias-a-las-que-pueda-llamar/",
  },
  {
    id: "linea-111",
    org: "Emergencias Colombia",
    label: "Atención de desastres — 111",
    purpose: "emergencia",
    description: "Línea de atención de desastres.",
    value: "111",
    href: "tel:111",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/08/10/sismo-de-74-en-colombia-estas-son-las-lineas-telefonicas-de-atencion-de-emergencias-a-las-que-pueda-llamar/",
  },
  {
    id: "linea-119",
    org: "Bomberos",
    label: "Bomberos — 119",
    purpose: "emergencia",
    description: "Incendios, rescates y estructuras colapsadas.",
    value: "119",
    href: "tel:119",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/08/10/sismo-de-74-en-colombia-estas-son-las-lineas-telefonicas-de-atencion-de-emergencias-a-las-que-pueda-llamar/",
  },
  {
    id: "linea-144",
    org: "Defensa Civil",
    label: "Defensa Civil — 144",
    purpose: "emergencia",
    description: "Búsqueda, rescate y atención de damnificados.",
    value: "144",
    href: "tel:144",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/08/10/sismo-de-74-en-colombia-estas-son-las-lineas-telefonicas-de-atencion-de-emergencias-a-las-que-pueda-llamar/",
  },
  {
    id: "linea-132",
    org: "Cruz Roja Colombiana",
    label: "Cruz Roja — 132",
    purpose: "emergencia",
    description: "Atención prehospitalaria y ayuda humanitaria.",
    value: "132",
    href: "tel:132",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/08/10/sismo-de-74-en-colombia-estas-son-las-lineas-telefonicas-de-atencion-de-emergencias-a-las-que-pueda-llamar/",
  },
  {
    id: "ungrd-gratuita",
    org: "UNGRD",
    label: "Línea nacional gratuita",
    purpose: "informacion",
    description:
      "Unidad Nacional para la Gestión del Riesgo de Desastres, entidad que coordina la respuesta.",
    value: "01 8000 113200",
    href: "tel:018000113200",
    verified: true,
    source: "https://portal.gestiondelriesgo.gov.co/",
  },
  {
    id: "ungrd-fijo",
    org: "UNGRD",
    label: "Conmutador UNGRD",
    purpose: "informacion",
    description: "Atención de 8:00 a. m. a 5:00 p. m.",
    value: "+57 601 552 9696",
    href: "tel:+576015529696",
    verified: true,
    source: "https://portal.gestiondelriesgo.gov.co/",
  },
  {
    id: "cruz-roja-donar",
    org: "Cruz Roja Colombiana",
    label: "Donar en línea",
    purpose: "donar_dinero",
    description:
      "Pasarela oficial de donación en dinero. Evita transcribir números de cuenta.",
    value: "cruzrojacolombiana.org/dona-dinero",
    href: "https://www.cruzrojacolombiana.org/dona-dinero/",
    verified: true,
    source: "https://www.cruzrojacolombiana.org/",
  },
  {
    id: "cruz-roja-linea",
    org: "Cruz Roja Colombiana",
    label: "Línea nacional gratuita",
    purpose: "donar_dinero",
    description: "Atención al ciudadano y orientación sobre donaciones.",
    value: "01 8005 198534",
    href: "tel:018005198534",
    verified: true,
    source: "https://www.cruzrojacolombiana.org/",
  },
  {
    id: "cruz-roja-correo",
    org: "Cruz Roja Colombiana",
    label: "Correo de atención",
    purpose: "informacion",
    description: "Consultas generales a la Cruz Roja Colombiana.",
    value: "cruzrojateescucha@cruzrojacolombiana.org",
    href: "mailto:cruzrojateescucha@cruzrojacolombiana.org",
    verified: true,
    source: "https://www.cruzrojacolombiana.org/",
  },
  {
    id: "rcf-whatsapp",
    org: "Cruz Roja Colombiana",
    label: "Buscar a un familiar (RCF)",
    purpose: "buscar_personas",
    description:
      "Restablecimiento del Contacto Familiar: solicitudes de localización de personas.",
    value: "321 213 9525",
    href: "https://wa.me/573212139525",
    // Publicado por prensa citando a la Cruz Roja Colombiana; no aparece en su
    // sitio oficial al momento de cargar estos datos.
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/06/30/la-cruz-roja-colombiana-dispuso-diversos-medios-de-recepcion-de-donaciones-para-damnificados-de-los-terremotos-en-venezuela/",
  },
  {
    id: "rcf-correo",
    org: "Cruz Roja Colombiana",
    label: "Correo de búsqueda de familiares",
    purpose: "buscar_personas",
    description: "Canal escrito para solicitudes de localización de personas.",
    value: "rcf@cruzrojacolombiana.org",
    href: "mailto:rcf@cruzrojacolombiana.org",
    verified: false,
    source:
      "https://www.infobae.com/colombia/2026/06/30/la-cruz-roja-colombiana-dispuso-diversos-medios-de-recepcion-de-donaciones-para-damnificados-de-los-terremotos-en-venezuela/",
  },
];

/** Etiquetas de sección para agrupar los canales en la UI. */
export const PURPOSE_META: Record<
  HelpChannelPurpose,
  { title: string; emoji: string; order: number }
> = {
  emergencia: { title: "Emergencia inmediata", emoji: "🚨", order: 0 },
  buscar_personas: { title: "Buscar a un familiar", emoji: "🔎", order: 1 },
  donar_dinero: { title: "Donar dinero", emoji: "💛", order: 2 },
  informacion: { title: "Información oficial", emoji: "🏛️", order: 3 },
};

/** Canales agrupados por propósito, en orden de urgencia. */
export function channelsByPurpose(): {
  purpose: HelpChannelPurpose;
  channels: HelpChannel[];
}[] {
  return (Object.keys(PURPOSE_META) as HelpChannelPurpose[])
    .sort((a, b) => PURPOSE_META[a].order - PURPOSE_META[b].order)
    .map((purpose) => ({
      purpose,
      channels: HELP_CHANNELS.filter((c) => c.purpose === purpose),
    }))
    .filter((group) => group.channels.length > 0);
}
