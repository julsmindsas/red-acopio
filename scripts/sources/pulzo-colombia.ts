/**
 * Fuente REAL: Pulzo — "Cómo ayudar a damnificados por sismos en Venezuela:
 * puntos de acopio, cuentas y campañas activas desde Colombia" (consultado
 * 2026-06-29).
 *
 * URL: https://www.pulzo.com/mundo/como-ayudar-venezuela-puntos-acopio-donaciones-campanas-desde-colombia-PP5230536
 *
 * De este artículo solo se extrae UN punto físico con dirección concreta en
 * Medellín: la Corporación El Minuto de Dios. Otros nombres citados (Laika,
 * Cedrizuela) aparecen sin dirección, por lo que NO se registran (regla de
 * honestidad: sin dirección verificable, no se publica un centro físico).
 *
 * Mismo patrón (B) que `eltiempo-medellin.ts`: datos curados a mano + chequeo
 * de frescura best-effort. Queda "sin_verificar" (es prensa).
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.pulzo.com/mundo/como-ayudar-venezuela-puntos-acopio-donaciones-campanas-desde-colombia-PP5230536";

const CENTERS: RawCenter[] = [
  {
    name: "Corporación El Minuto de Dios - Medellín",
    address: "Carrera 49 #53-19, Oficina 403, Edificio Bancoquia, Medellín",
    materials: [
      "alimentos no perecederos",
      "kits de aseo",
      "colchonetas",
      "herramientas",
      "agua potable",
      "leche",
      "fórmulas infantiles",
      "medicamentos",
      "pañales",
      "cobijas",
      "ropa",
      "zapatos",
      "productos de limpieza",
      "carpas",
      "linternas",
      "baterías",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "Carrera 49 #53-19, Medellin, Antioquia, Colombia",
    verifyToken: "Minuto de Dios",
    notes: "Punto de la Corporación El Minuto de Dios (campaña 'Un Minuto por los panas'). Oficina 403, Edificio Bancoquia.",
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
      console.warn(`  [pulzo-colombia] HTTP ${res.status} al verificar la página.`);
      return null;
    }
    const $ = cheerio.load(await res.text());
    return $("body").text();
  } catch (err) {
    console.warn(
      `  [pulzo-colombia] No se pudo descargar la página para verificar (¿sin internet?): ${(err as Error).message}`,
    );
    return null;
  }
}

export const pulzoColombia: Source = {
  id: "pulzo-colombia",
  label: "Pulzo – Colombia (acopio Venezuela)",
  url: URL,

  async run(): Promise<RawCenter[]> {
    const pageText = await fetchPageText(URL);
    if (pageText) {
      const haystack = pageText.toLowerCase();
      for (const c of CENTERS) {
        const token = (c.verifyToken ?? c.name).toLowerCase();
        if (!haystack.includes(token)) {
          console.warn(
            `  [pulzo-colombia] ADVERTENCIA: "${c.name}" (token "${c.verifyToken}") ya no aparece en la página. Verificar manualmente.`,
          );
        }
      }
    } else {
      console.warn(
        "  [pulzo-colombia] Verificación de frescura omitida (página no descargable). Se devuelven los datos curados del 2026-06-29.",
      );
    }
    return CENTERS;
  },
};
