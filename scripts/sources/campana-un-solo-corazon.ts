/**
 * Fuente REAL: campaña nacional «Colombia, un solo corazón» — puntos de acopio
 * anunciados por la Primera Dama (consultado 2026-08-11).
 *
 * Fuentes:
 *   - Infobae: https://www.infobae.com/colombia/2026/08/11/tras-el-fuerte-terremoto-en-colombia-la-primera-dama-ana-lucia-pineda-anuncio-puntos-de-acopio-de-ayudas-humanitarias-un-solo-corazon/
 *   - Pulzo:   https://www.pulzo.com/nacion/terremoto-en-colombia-puntos-de-donacion-y-ayudas-para-afectados-en-choco-PP5271365A
 *
 * IMPORTANCIA: aquí está el **primer punto de acopio del Chocó** que alguna
 * fuente publicó con dirección y teléfono. El Chocó es el epicentro y el
 * departamento con más damnificados (~3.500 en 21 municipios), y llevaba dos
 * días sin un solo punto localizable: ni la Gobernación ni la Alcaldía de
 * Quibdó habían publicado nada en sus portales.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const INFOBAE_URL =
  "https://www.infobae.com/colombia/2026/08/11/tras-el-fuerte-terremoto-en-colombia-la-primera-dama-ana-lucia-pineda-anuncio-puntos-de-acopio-de-ayudas-humanitarias-un-solo-corazon/";

const PULZO_URL =
  "https://www.pulzo.com/nacion/terremoto-en-colombia-puntos-de-donacion-y-ayudas-para-afectados-en-choco-PP5271365A";

/** Lo que la campaña pide en todos sus puntos. */
const MATERIALES = [
  "agua",
  "alimentos no perecederos",
  "artículos de higiene personal",
  "cobijas",
  "elementos de descanso",
  "primeros auxilios",
];

const CENTERS: RawCenter[] = [
  // --- Chocó: el epicentro ------------------------------------------------
  {
    name: "Centro de acopio — Quibdó (Colombia, un solo corazón)",
    address: "Calle 27A #23-44, barrio Los Ángeles, sector San Gabriel, Quibdó",
    phone: "310 805 0535",
    materials: MATERIALES,
    sourceUrl: INFOBAE_URL,
    municipality: "Quibdó",
    geoQuery: "Calle 27A #23-44, Quibdo, Choco, Colombia",
    verifyToken: "310 805 0535",
    notes:
      "Punto de la campaña nacional «Colombia, un solo corazón» en la capital del Chocó, el departamento del epicentro. Llama antes de ir: es el único punto publicado en el departamento y puede saturarse.",
  },

  // --- Otras ciudades de la campaña ---------------------------------------
  {
    name: "Centro de Solidaridad — Bucaramanga",
    address: "Calle 54 #21A-07, barrio La Concordia, Bucaramanga",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Bucaramanga",
    geoQuery: "Calle 54 #21A-07, Bucaramanga, Santander, Colombia",
    verifyToken: "La Concordia",
  },
  {
    name: "Centro de Solidaridad — Valledupar",
    address: "Carrera 23 #4-116, conjunto residencial Callejas, Valledupar",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Valledupar",
    geoQuery: "Carrera 23 #4-116, Valledupar, Cesar, Colombia",
    verifyToken: "Callejas",
    notes: "El Centro de Solidaridad de Valledupar también recibe elementos para mascotas.",
  },
  {
    name: "Centro de acopio — Emisora Universal Stereo, Pailitas",
    address: "Emisora Universal Stereo, barrio El Bosque, Pailitas, Cesar",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Pailitas",
    geoQuery: "Pailitas, Cesar, Colombia",
    verifyToken: "Universal Stereo",
  },
  {
    name: "Centro de acopio — Parroquia Nuestra Señora del Perpetuo Socorro",
    address: "Parroquia Nuestra Señora del Perpetuo Socorro, Bocagrande, Cartagena",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Cartagena",
    geoQuery: "Parroquia Nuestra Señora del Perpetuo Socorro, Bocagrande, Cartagena, Colombia",
    verifyToken: "Perpetuo Socorro",
  },
  {
    name: "Centro de acopio — Parroquia Cristo Rey, Crespo",
    address: "Parroquia Cristo Rey, barrio Crespo, Cartagena",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Cartagena",
    geoQuery: "Parroquia Cristo Rey, Crespo, Cartagena, Colombia",
    verifyToken: "Cristo Rey",
  },
  {
    name: "Centro de acopio — Casa Abelardista, Barranquilla",
    address: "Carrera 49C #80-76, Barranquilla",
    schedule: "9:00 a. m. - 5:00 p. m.",
    materials: MATERIALES,
    sourceUrl: PULZO_URL,
    municipality: "Barranquilla",
    geoQuery: "Carrera 49C #80-76, Barranquilla, Atlántico, Colombia",
    verifyToken: "Abelardista",
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

export const campanaUnSoloCorazon: Source = {
  id: "campana-un-solo-corazon",
  label: "Campaña «Colombia, un solo corazón» (incluye Quibdó)",
  url: INFOBAE_URL,

  async run(): Promise<RawCenter[]> {
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
          `    [frescura] "${c.verifyToken}" ya no aparece en su fuente. Revisar a mano.`,
        );
      }
    }

    return CENTERS;
  },
};
