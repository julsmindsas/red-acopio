/**
 * Fuente REAL: El Tiempo — "Así puede apoyar a las personas afectadas por los
 * terremotos en Venezuela desde Medellín" (consultado 2026-06-29).
 *
 * URL: https://www.eltiempo.com/colombia/medellin/asi-puede-apoyar-a-las-personas-afectadas-por-los-terremotos-en-venezuela-desde-medellin-donaciones-centros-de-acopio-y-busqueda-de-desaparecidos-3567045
 *
 * PATRÓN (B) — el artículo publica las direcciones EN PROSA, no en una tabla.
 * Parsear esa prosa "a ciegas" con cheerio es frágil y peligroso para una app
 * humanitaria (riesgo de cruzar la dirección de un centro con otro). Por eso:
 *
 *   1. Los datos se extrajeron a MANO, leyendo el artículo, y quedan abajo como
 *      constantes con su `sourceUrl` real (transparente y auditable).
 *   2. En cada ejecución, `run()` descarga la página real e intenta CONFIRMAR
 *      que cada centro sigue mencionado (chequeo de frescura). Si la red falla
 *      o un centro ya no aparece, lo registra en consola pero NO inventa ni
 *      borra datos: devuelve la extracción curada tal cual.
 *
 * Todos quedan como "sin_verificar" (lo marca el orquestador): es prensa, no una
 * fuente oficial de gobierno/Cruz Roja.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.eltiempo.com/colombia/medellin/asi-puede-apoyar-a-las-personas-afectadas-por-los-terremotos-en-venezuela-desde-medellin-donaciones-centros-de-acopio-y-busqueda-de-desaparecidos-3567045";

/**
 * Extracción curada del artículo (leída el 2026-06-29). Cada `materials` está en
 * el mismo texto que usa la fuente; el orquestador lo mapea a categorías.
 */
const CENTERS: RawCenter[] = [
  {
    name: "Institución Educativa Héctor Abad Gómez (Placita de Flores)",
    address: "Calle 50 #39-65, Placita de Flores (barrio Boston), Medellín",
    materials: [
      "agua potable",
      "alimentos no perecederos",
      "insumos médicos",
      "ropa",
      "abrigos",
    ],
    schedule: "Todos los días 8:00 a.m. - 5:00 p.m. (desde el 26 de junio de 2026)",
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "Calle 50 #39-65, Medellin, Antioquia, Colombia",
    verifyToken: "Abad Gómez",
    notes:
      "El Tiempo lo describe como el punto de acopio dispuesto en Medellín. Nota: El Colombiano (26-jun-2026) advirtió que para ese momento ningún organismo oficial había anunciado recepción de ayudas físicas; confirmar vigencia antes de acudir.",
  },
  {
    name: "Grupo Mega - Itagüí",
    address: "Mall Itagüí, local 146, Itagüí",
    materials: [
      "agua",
      "alimentos no perecederos",
      "medicinas",
      "productos de higiene",
      "pañales",
      "ropa en buen estado",
      "alimento para mascotas",
    ],
    sourceUrl: URL,
    municipality: "Itagüí",
    geoQuery: "Mall Itagui, Itagui, Antioquia, Colombia",
    verifyToken: "Grupo Mega",
    notes: "Centro de acopio dispuesto por Grupo Mega. También recibe alimento para mascotas (categoría 'otros').",
  },
  {
    name: "Grupo Mega - Bello",
    address: "Carrera 50 #50-15, sector Parque de Bello, Bello",
    materials: [
      "agua",
      "alimentos no perecederos",
      "medicinas",
      "productos de higiene",
      "pañales",
      "ropa en buen estado",
      "alimento para mascotas",
    ],
    sourceUrl: URL,
    municipality: "Bello",
    geoQuery: "Carrera 50 #50-15, Bello, Antioquia, Colombia",
    verifyToken: "Grupo Mega",
    notes: "Centro de acopio dispuesto por Grupo Mega. También recibe alimento para mascotas (categoría 'otros').",
  },
  {
    name: "Restaurante Tepuy - Laureles",
    address: "Carrera 73C #3-5, Laureles, Medellín",
    materials: [
      "material para curaciones",
      "elementos de protección",
      "antisépticos",
      "medicamentos básicos",
      "elementos de primeros auxilios",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    // La dirección exacta no fue geocodificable; se usa la carrera en Laureles.
    geoQuery: "Carrera 73C, Laureles, Medellin, Antioquia, Colombia",
    verifyToken: "Tepuy",
    notes: "Punto de recolección del restaurante venezolano Tepuy; enfocado en insumos médicos y de primeros auxilios.",
  },
  {
    name: "Restaurante Tepuy - Envigado",
    address: "Transversal 32A Sur #31E-20, Envigado",
    materials: [
      "material para curaciones",
      "elementos de protección",
      "antisépticos",
      "medicamentos básicos",
      "elementos de primeros auxilios",
    ],
    sourceUrl: URL,
    municipality: "Envigado",
    geoQuery: "Transversal 32a sur #31e-20, Envigado, Antioquia, Colombia",
    verifyToken: "Tepuy",
    notes: "Punto de recolección del restaurante venezolano Tepuy; enfocado en insumos médicos y de primeros auxilios.",
  },
  {
    name: "Semper Café - Belén",
    address: "Barrio Belén, Medellín (dirección exacta no publicada)",
    materials: [
      "medicamentos",
      "agua potable",
      "alimentos no perecederos",
      "mantas",
      "cobijas",
      "toallas sanitarias",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "Belen, Medellin, Antioquia, Colombia",
    verifyToken: "Semper",
    notes: "La fuente no publicó dirección exacta; coordenadas aproximadas al centroide del barrio Belén. Confirmar ubicación con el establecimiento antes de acudir.",
  },
  {
    name: "Simón Coffee - El Poblado",
    address: "Barrio El Poblado, Medellín (dirección exacta no publicada)",
    materials: [
      "medicamentos",
      "agua potable",
      "alimentos no perecederos",
      "mantas",
      "cobijas",
      "toallas sanitarias",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "El Poblado, Medellin, Antioquia, Colombia",
    verifyToken: "Simón Coffee",
    notes: "La fuente no publicó dirección exacta; coordenadas aproximadas al centroide de El Poblado. Confirmar ubicación con el establecimiento antes de acudir.",
  },
  {
    name: "Calante Bar - El Poblado",
    address: "Barrio El Poblado, Medellín (dirección exacta no publicada)",
    materials: [
      "medicamentos",
      "agua potable",
      "alimentos no perecederos",
      "mantas",
      "cobijas",
      "toallas sanitarias",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "El Poblado, Medellin, Antioquia, Colombia",
    verifyToken: "Calante",
    notes: "La fuente no publicó dirección exacta; coordenadas aproximadas al centroide de El Poblado. Confirmar ubicación con el establecimiento antes de acudir.",
  },
];

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "red-acopio-scraper/1.0 (proyecto humanitario; +https://github.com/)",
        "Accept-Language": "es-CO,es;q=0.9",
      },
    });
    if (!res.ok) {
      console.warn(`  [eltiempo-medellin] HTTP ${res.status} al verificar la página.`);
      return null;
    }
    const html = await res.text();
    // cheerio sobre el HTML REAL: extraemos el texto plano para el chequeo.
    const $ = cheerio.load(html);
    return $("body").text();
  } catch (err) {
    console.warn(
      `  [eltiempo-medellin] No se pudo descargar la página para verificar (¿sin internet?): ${(err as Error).message}`,
    );
    return null;
  }
}

export const elTiempoMedellin: Source = {
  id: "eltiempo-medellin",
  label: "El Tiempo – Medellín (acopio Venezuela)",
  url: URL,

  async run(): Promise<RawCenter[]> {
    // Chequeo de frescura (best-effort): confirmar que los centros siguen
    // mencionados en la página real. No altera los datos curados.
    const pageText = await fetchPageText(URL);
    if (pageText) {
      const haystack = pageText.toLowerCase();
      for (const c of CENTERS) {
        const token = (c.verifyToken ?? c.name).toLowerCase();
        if (!haystack.includes(token)) {
          console.warn(
            `  [eltiempo-medellin] ADVERTENCIA: "${c.name}" (token "${c.verifyToken}") ya no aparece en la página. Verificar manualmente la fuente.`,
          );
        }
      }
    } else {
      console.warn(
        "  [eltiempo-medellin] Verificación de frescura omitida (página no descargable). Se devuelven los datos curados del 2026-06-29.",
      );
    }
    return CENTERS;
  },
};
