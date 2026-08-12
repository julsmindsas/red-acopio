/**
 * Fuente REAL: El Diario (Pereira) — "Emergencia en Pereira: avanzan labores de
 * búsqueda y rescate" (consultado 2026-08-11).
 *
 * URL: https://www.eldiario.com.co/actualidad/emergencia-en-pereira-avanzan-labores-de-busqueda-y-rescate/
 *
 * PATRÓN (B): la nota publica los albergues y centros de acopio en prosa. Los
 * datos se extrajeron a mano y se verifica la frescura en cada corrida.
 *
 * Pereira es la ciudad con más víctimas del sismo (73 fallecidos y 66 edificios
 * con colapso total al momento de la consulta). La Alcaldía habilitó seis
 * albergues y siete centros de acopio, pero **ninguna fuente publicó su
 * dirección exacta**: son lugares conocidos de la ciudad, nombrados por su
 * nombre popular. Por eso cada punto se geocodifica por nombre y advierte que
 * la ubicación puede ser aproximada.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.eldiario.com.co/actualidad/emergencia-en-pereira-avanzan-labores-de-busqueda-y-rescate/";

/** Nota compartida: la fuente es prensa local citando a la Alcaldía. */
const NOTA_ALBERGUE =
  "Albergue temporal habilitado por la Alcaldía de Pereira tras el sismo del 10 de agosto de 2026, según El Diario. La fuente no publicó dirección exacta.";

const NOTA_ACOPIO =
  "Centro de acopio de ayudas humanitarias en un Centro de Desarrollo Empresarial de la Alcaldía de Pereira, según El Diario. La fuente no publicó dirección exacta ni horario.";

/** Materiales que la nota indica para los centros de acopio de la ciudad. */
const MATERIALES_ACOPIO = [
  "alimentos no perecederos",
  "agua",
  "elementos de aseo",
];

const CENTERS: RawCenter[] = [
  // --- Albergues temporales (6) -------------------------------------------
  {
    name: "Albergue temporal — Coliseo Mayor de Pereira",
    kind: "albergue",
    address: "Coliseo Mayor, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Coliseo Mayor, Pereira, Risaralda, Colombia",
    verifyToken: "Coliseo Mayor",
    notes: NOTA_ALBERGUE,
  },
  {
    name: "Albergue temporal — Parque El Vergel",
    kind: "albergue",
    address: "Parque El Vergel, barrio El Vergel, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    // El parque no figura en OpenStreetMap; el barrio sí. Preferimos el barrio
    // (a ~1 km) antes que caer al centroide del municipio.
    geoQuery: "El Vergel, Pereira, Risaralda, Colombia",
    verifyToken: "El Vergel",
    notes: `${NOTA_ALBERGUE} UBICACIÓN APROXIMADA: el parque no está en OpenStreetMap, así que el punto usa el barrio El Vergel.`,
  },
  {
    name: "Albergue temporal — Parque El Oso",
    kind: "albergue",
    address: "Parque El Oso, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Parque El Oso, Pereira, Risaralda, Colombia",
    verifyToken: "El Oso",
    notes: NOTA_ALBERGUE,
  },
  {
    name: "Albergue temporal — Estadio Mora Mora",
    kind: "albergue",
    address: "Estadio Mora Mora, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Estadio Mora Mora, Pereira, Risaralda, Colombia",
    verifyToken: "Mora Mora",
    notes: NOTA_ALBERGUE,
  },
  {
    name: "Albergue temporal — Parque Olaya Herrera",
    kind: "albergue",
    address: "Parque Olaya Herrera, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Parque Olaya Herrera, Pereira, Risaralda, Colombia",
    verifyToken: "Olaya Herrera",
    notes: NOTA_ALBERGUE,
  },
  {
    name: "Albergue temporal — Plaza de Ferias",
    kind: "albergue",
    address: "Plaza de Ferias, Pereira, Risaralda",
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Plaza de Ferias, Pereira, Risaralda, Colombia",
    verifyToken: "Plaza de Ferias",
    notes: NOTA_ALBERGUE,
  },

  // --- Centros de acopio: Centros de Desarrollo Empresarial (7) -----------
  {
    name: "Centro de acopio — CDE Parque Industrial",
    address: "Centro de Desarrollo Empresarial, Parque Industrial, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Parque Industrial, Pereira, Risaralda, Colombia",
    verifyToken: "Parque Industrial",
    notes: NOTA_ACOPIO,
  },
  {
    name: "Centro de acopio — CDE 2.500 Lotes",
    address: "Centro de Desarrollo Empresarial, barrio 2.500 Lotes, comuna Villa Santana, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    // CUIDADO: buscar "2500 Lotes, Pereira" en Nominatim devuelve un conjunto
    // residencial de Puerto Caldas, a 20 km del barrio real. Se geocodifica la
    // comuna Villa Santana, donde sí está el barrio.
    geoQuery: "Villa Santana, Pereira, Risaralda, Colombia",
    verifyToken: "2.500 Lotes",
    notes: `${NOTA_ACOPIO} UBICACIÓN APROXIMADA: el punto usa la comuna Villa Santana, donde está el barrio 2.500 Lotes.`,
  },
  {
    name: "Centro de acopio — CDE Tokio",
    address: "Centro de Desarrollo Empresarial, barrio Tokio, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Tokio, Pereira, Risaralda, Colombia",
    verifyToken: "Tokio",
    notes: NOTA_ACOPIO,
  },
  {
    name: "Centro de acopio — CDE Consota",
    address: "Centro de Desarrollo Empresarial, sector Consota, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Consota, Pereira, Risaralda, Colombia",
    verifyToken: "Consota",
    notes: NOTA_ACOPIO,
  },
  {
    name: "Centro de acopio — CDE Kennedy",
    address: "Centro de Desarrollo Empresarial, barrio Kennedy, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Kennedy, Pereira, Risaralda, Colombia",
    verifyToken: "Kennedy",
    notes: NOTA_ACOPIO,
  },
  {
    name: "Centro de acopio — CDE Ormazá",
    address: "Centro de Desarrollo Empresarial, barrio Ormazá, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Ormaza, Pereira, Risaralda, Colombia",
    verifyToken: "Ormazá",
    notes: NOTA_ACOPIO,
  },
  {
    name: "Centro de acopio — CDE San Nicolás",
    address: "Centro de Desarrollo Empresarial, barrio San Nicolás, Pereira",
    materials: MATERIALES_ACOPIO,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "San Nicolas, Pereira, Risaralda, Colombia",
    verifyToken: "San Nicolás",
    notes: NOTA_ACOPIO,
  },
];

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "red-acopio-scraper/1.0 (proyecto humanitario; contacto: adminapps@julsmind.com)",
      "Accept-Language": "es-CO,es;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  return res.text();
}

export const elDiarioPereira: Source = {
  id: "eldiario-pereira",
  label: "El Diario — albergues y acopios de Pereira",
  url: URL,

  async run(): Promise<RawCenter[]> {
    try {
      const text = cheerio.load(await fetchHtml(URL)).text();
      for (const c of CENTERS) {
        if (c.verifyToken && !text.includes(c.verifyToken)) {
          console.warn(
            `    [frescura] "${c.verifyToken}" ya no aparece en la nota. Revisar a mano.`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `    [frescura] no se pudo verificar la fuente (${(err as Error).message}).`,
      );
    }

    return CENTERS;
  },
};
