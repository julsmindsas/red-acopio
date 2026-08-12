/**
 * Fuentes OFICIALES: publicaciones de las propias entidades responsables.
 *
 * A diferencia del resto de adaptadores —que recogen prensa citando a una
 * autoridad—, estos puntos los publicó la entidad misma en su portal. Por eso
 * llevan `official: true` y el orquestador los marca como **verificado**.
 *
 * Fuentes:
 *   - Alcaldía de Santiago de Cali (cali.gov.co), 2026-08-11
 *   - Gobernación del Quindío (quindio.gov.co), 2026-08-11
 *
 * Ambas las detectó el monitor `portales-oficiales.ts` y se curaron a mano.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const CALI_URL =
  "https://www.cali.gov.co/publicaciones/193608/solidaridad-calena-se-toma-el-centro-de-acopio-de-la-plazoleta-jairo-varela/";

const QUINDIO_URL =
  "https://quindio.gov.co/un-llamado-a-la-solidaridad-el-centro-de-convenciones-se-transforma-en-el-centro-de-acopio-para-ayudas-a-afectados-por-el-sismo-2";

const CENTERS: RawCenter[] = [
  {
    name: "Centro de acopio — Plazoleta Jairo Varela",
    address: "Plazoleta Jairo Varela, Cali, Valle del Cauca",
    materials: [
      "agua",
      "alimentos no perecederos",
      "colchonetas",
      "cobijas",
      "elementos de primeros auxilios",
      "guantes de construcción",
      "cascos",
      "linternas",
      "ropa",
    ],
    sourceUrl: CALI_URL,
    official: true,
    municipality: "Cali",
    geoQuery: "Plazoleta Jairo Varela, Cali, Valle del Cauca, Colombia",
    verifyToken: "Jairo Varela",
    notes:
      "Centro de acopio principal de la Alcaldía de Cali. También recibe herramientas de rescate (picas, palas, barras) y baños móviles. Se pide a quienes van a ayudar como voluntarios llegar después de las 3:00 p. m. para organizar y despachar los kits.",
  },
  {
    name: "Centro de acopio — Escuela Nacional del Deporte",
    address: "Escuela Nacional del Deporte, Cali, Valle del Cauca",
    materials: [
      "agua",
      "alimentos no perecederos",
      "colchonetas",
      "cobijas",
      "elementos de primeros auxilios",
    ],
    sourceUrl: CALI_URL,
    official: true,
    municipality: "Cali",
    geoQuery: "Escuela Nacional del Deporte, Cali, Valle del Cauca, Colombia",
    verifyToken: "Escuela Nacional del Deporte",
    notes:
      "Punto de acopio alternativo mencionado por la Alcaldía de Cali junto a la Plazoleta Jairo Varela.",
  },
  {
    name: "Centro de acopio — Centro de Convenciones de Armenia",
    address: "Centro de Convenciones, Armenia, Quindío",
    materials: [
      "agua",
      "alimentos no perecederos",
      "elementos de aseo",
      "colchonetas",
      "cobijas",
    ],
    sourceUrl: QUINDIO_URL,
    official: true,
    municipality: "Armenia",
    geoQuery: "Centro de Convenciones, Armenia, Quindío, Colombia",
    verifyToken: "Centro de Convenciones",
    notes:
      "La Gobernación del Quindío habilitó el Centro de Convenciones como centro de acopio para los afectados por el sismo.",
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

export const alcaldiasOficiales: Source = {
  id: "alcaldias-oficiales",
  label: "Alcaldías y gobernaciones — publicaciones oficiales",
  url: CALI_URL,

  async run(): Promise<RawCenter[]> {
    // Verifica cada URL una sola vez, aunque varios puntos la compartan.
    const urls = [...new Set(CENTERS.map((c) => c.sourceUrl))];
    const texts = new Map<string, string>();

    for (const url of urls) {
      try {
        texts.set(url, cheerio.load(await fetchHtml(url)).text());
      } catch (err) {
        console.warn(
          `    [frescura] no se pudo verificar ${url} (${(err as Error).message}).`,
        );
      }
    }

    for (const c of CENTERS) {
      const text = texts.get(c.sourceUrl);
      if (text && c.verifyToken && !text.includes(c.verifyToken)) {
        console.warn(
          `    [frescura] "${c.verifyToken}" ya no aparece en su fuente oficial. Revisar a mano.`,
        );
      }
    }

    return CENTERS;
  },
};
