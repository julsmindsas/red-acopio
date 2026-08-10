/**
 * Fuente REAL: Semana — declaraciones del alcalde de Manizales tras el sismo del
 * 10 de agosto de 2026 (consultado el 2026-08-10).
 *
 * URL: https://www.semana.com/nacion/articulo/alcalde-de-manizales-reporta-dos-personas-muertas-mas-de-10-edificios-colapsados-y-muchas-viviendas-afectadas-estamos-atendiendo-este-desastre/202623/
 *
 * PATRÓN (B) — la nota publica los albergues EN PROSA, dentro de una declaración
 * del alcalde. Parsear esa prosa a ciegas es frágil y peligroso en una app
 * humanitaria, así que:
 *
 *   1. Los datos se extrajeron a MANO y quedan abajo como constantes, con su
 *      `sourceUrl` real.
 *   2. En cada ejecución, `run()` descarga la página e intenta CONFIRMAR que
 *      sigue mencionando cada albergue. Si la red falla o desaparece una
 *      mención, lo avisa por consola pero no inventa ni borra nada.
 *
 * Quedan como "sin_verificar" (lo marca el orquestador): es prensa citando a la
 * Alcaldía, no un listado oficial publicado por la entidad.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.semana.com/nacion/articulo/alcalde-de-manizales-reporta-dos-personas-muertas-mas-de-10-edificios-colapsados-y-muchas-viviendas-afectadas-estamos-atendiendo-este-desastre/202623/";

/**
 * Extracción curada de la nota (leída el 2026-08-10).
 *
 * Los albergues no reciben donaciones, así que `materials` va vacío: el tipo de
 * punto (`kind: "albergue"`) es lo que importa.
 */
const CENTERS: RawCenter[] = [
  {
    name: "Albergue temporal — Coliseo Mayor de Manizales",
    kind: "albergue",
    address: "Coliseo Mayor, Carrera 24, barrio Palogrande, Manizales, Caldas",
    schedule: "Habilitado tras el sismo del 10 de agosto de 2026",
    sourceUrl: URL,
    municipality: "Manizales",
    geoQuery: "Coliseo Mayor, Manizales, Caldas, Colombia",
    verifyToken: "Coliseo Mayor",
    notes:
      "El alcalde informó que se habilitó un albergue temporal en el Coliseo Mayor y que quienes lo requieran pueden acudir. Confirma la disponibilidad antes de trasladarte.",
  },
  {
    name: "Albergue temporal — Coliseo Menor de Manizales",
    kind: "albergue",
    address: "Coliseo Menor, Avenida Lindsay, barrio Guayacanes, Manizales, Caldas",
    schedule: "En montaje tras el sismo del 10 de agosto de 2026",
    sourceUrl: URL,
    municipality: "Manizales",
    geoQuery: "Coliseo Menor, Manizales, Caldas, Colombia",
    verifyToken: "Coliseo Menor",
    notes:
      "Reportado como uno de los tres albergues que la Alcaldía estaba montando. No se ha confirmado que ya esté operando: consulta antes de trasladarte.",
  },
  {
    name: "Albergue temporal — Coliseo del barrio Aranjuez",
    kind: "albergue",
    address: "Barrio Aranjuez, Comuna Universitaria, Manizales, Caldas",
    schedule: "En montaje tras el sismo del 10 de agosto de 2026",
    sourceUrl: URL,
    municipality: "Manizales",
    // El coliseo no figura como punto en OpenStreetMap: geocodificamos el
    // barrio y lo advertimos en las notas en vez de fingir precisión.
    geoQuery: "Aranjuez, Manizales, Caldas, Colombia",
    verifyToken: "Aranjuez",
    notes:
      "Reportado como uno de los tres albergues en montaje. UBICACIÓN APROXIMADA: el coliseo no está en OpenStreetMap, así que el punto usa el centroide del barrio Aranjuez. Confirma la dirección exacta antes de trasladarte.",
  },
];

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "red-acopio-scraper/1.0 (proyecto humanitario; contacto: adminapps@julsmind.com)",
      "Accept-Language": "es-CO,es;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  return res.text();
}

export const semanaManizales: Source = {
  id: "semana-manizales-albergues",
  label: "Semana — albergues de Manizales (sismo 10-ago-2026)",
  url: URL,

  async run(): Promise<RawCenter[]> {
    // Chequeo de frescura: no altera los datos, solo informa.
    try {
      const html = await fetchHtml(URL);
      const text = cheerio.load(html).text();
      for (const c of CENTERS) {
        if (c.verifyToken && !text.includes(c.verifyToken)) {
          console.warn(
            `    [frescura] "${c.verifyToken}" ya no aparece en la nota de Semana. Revisar manualmente.`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `    [frescura] no se pudo verificar la fuente (${(err as Error).message}). Se usa la extracción curada.`,
      );
    }

    return CENTERS;
  },
};
