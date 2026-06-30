/**
 * Fuente REAL: Pulzo / Infobae — Laika "Patitas por Venezuela"
 * (consultado 2026-06-30).
 *
 * URLs:
 *   - Pulzo (fuente primaria):
 *     https://www.pulzo.com/mundo/laika-habilito-puntos-acopio-para-ayudar-mascotas-terremoto-venezuela-PP5230073
 *   - Infobae (confirmación secundaria):
 *     https://www.infobae.com/colombia/2026/06/27/asi-puede-ayudar-a-los-animales-afectados-por-el-terremoto-en-venezuela-bogota-abrio-puntos-de-donacion/
 *
 * PATRÓN (B) — los artículos publican las direcciones EN PROSA, no en tabla.
 * Parsear esa prosa "a ciegas" con cheerio es frágil y peligroso para una app
 * humanitaria (riesgo de cruzar la dirección de un local con otro). Por eso:
 *
 *   1. Los datos se extrajeron A MANO leyendo los artículos y quedan abajo
 *      como constantes con sus `sourceUrl` reales (transparente y auditable).
 *   2. En cada ejecución, `run()` descarga la página de Pulzo e intenta
 *      CONFIRMAR que Laika y los puntos de Medellín siguen mencionados
 *      (chequeo de frescura). Si la red falla o el contenido cambió, lo
 *      registra en consola pero NO inventa ni borra datos.
 *
 * CAMPAÑA: "Patitas por Venezuela" (Laika Mascotas)
 *   - Vigencia informada: 25–30 de junio de 2026.
 *   - Materiales: alimento seco/húmedo para perros y gatos, agua,
 *     medicamentos veterinarios, productos de aseo, alimentos no
 *     perecederos para personas damnificadas.
 *   - Organización líder: Laika Mascotas (laika.com.co).
 *
 * Todos los centros quedan como "sin_verificar" (lo establece el
 * orquestador): la fuente es prensa, no un organismo oficial.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

/** URL principal del artículo (fuente primaria). */
const PRIMARY_URL =
  "https://www.pulzo.com/mundo/laika-habilito-puntos-acopio-para-ayudar-mascotas-terremoto-venezuela-PP5230073";

/**
 * Centros curados manualmente a partir de los artículos de Pulzo e Infobae
 * (consultados el 2026-06-30). Ambos coinciden en los tres puntos de Medellín.
 *
 * Los materiales están en texto libre tal como los describe la fuente; el
 * orquestador los mapea a las categorías del contrato de la app.
 */
const CENTERS: RawCenter[] = [
  {
    name: "Laika Mascotas — Arkadia",
    address: "Carrera 70 #1-141, local 9822, Medellín",
    materials: [
      "alimento seco para perros y gatos",
      "alimento húmedo para perros y gatos",
      "agua",
      "medicamentos veterinarios",
      "productos de aseo",
      "alimentos no perecederos",
    ],
    schedule:
      "25 al 30 de junio de 2026 (horario de tienda; no publicado explícitamente)",
    sourceUrl: PRIMARY_URL,
    municipality: "Medellín",
    // Nominatim halló el POI "Centro Comercial Arkadia" (6.2123737, -75.5947090).
    // El local 9822 está dentro del centro; se pasa la geocodificación del POI.
    geoQuery: "Centro Comercial Arkadia, Medellin, Colombia",
    verifyToken: "Arkadia",
    notes:
      "Campaña 'Patitas por Venezuela'. Geocodificación: POI del centro comercial Arkadia vía Nominatim/OSM, 2026-06-30 (la tienda Laika está en el local 9822).",
  },
  {
    name: "Laika Mascotas — El Poblado",
    address: "Calle 2 Sur #32-54, El Poblado, Medellín",
    materials: [
      "alimento seco para perros y gatos",
      "alimento húmedo para perros y gatos",
      "agua",
      "medicamentos veterinarios",
      "productos de aseo",
      "alimentos no perecederos",
    ],
    schedule:
      "25 al 30 de junio de 2026 (horario de tienda; no publicado explícitamente)",
    sourceUrl: PRIMARY_URL,
    municipality: "Medellín",
    geoQuery: "Calle 2 Sur #32-54, El Poblado, Medellin, Colombia",
    verifyToken: "Poblado",
    notes:
      "Campaña 'Patitas por Venezuela'. Geocodificación: nivel de calle vía Nominatim/OSM, 2026-06-30.",
  },
  {
    name: "Laika Mascotas — Llanogrande",
    address: "Vía Llanogrande - Ríogrande, Km 7, Rionegro, Antioquia",
    materials: [
      "alimento seco para perros y gatos",
      "alimento húmedo para perros y gatos",
      "agua",
      "medicamentos veterinarios",
      "productos de aseo",
      "alimentos no perecederos",
    ],
    schedule:
      "25 al 30 de junio de 2026 (horario de tienda; no publicado explícitamente)",
    sourceUrl: PRIMARY_URL,
    municipality: "Rionegro",
    // La búsqueda por "km 7 vía Llanogrande" no arrojó resultado en Nominatim;
    // se geocodifica al corregimiento de Llanogrande como aproximación.
    geoQuery: "Llanogrande, Rionegro, Antioquia, Colombia",
    verifyToken: "Llanogrande",
    notes:
      "Campaña 'Patitas por Venezuela'. Municipio: Rionegro (Oriente Antioqueño), agrupado por la fuente como sede de 'Medellín'. Geocodificación APROXIMADA al corregimiento de Llanogrande vía Nominatim/OSM, 2026-06-30 (el Km 7 exacto no se halló en OSM; confirmar antes de ir).",
  },
];

/** Descarga el HTML de una URL de forma silenciosa (no lanza en caso de error). */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "red-acopio-scraper/1.0 (proyecto humanitario; +https://github.com/julsmindsas/red-acopio)",
        "Accept-Language": "es-CO,es;q=0.9",
      },
    });
    if (!res.ok) {
      console.warn(
        `  [laika-mascotas] HTTP ${res.status} al verificar la página.`,
      );
      return null;
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    return $("body").text();
  } catch (err) {
    console.warn(
      `  [laika-mascotas] No se pudo descargar la página para verificar (¿sin internet?): ${(err as Error).message}`,
    );
    return null;
  }
}

export const laikaMascotas: Source = {
  id: "laika-mascotas",
  label: "Laika – Patitas por Venezuela (mascotas, Medellín)",
  url: PRIMARY_URL,

  async run(): Promise<RawCenter[]> {
    // Chequeo de frescura (best-effort): verificar que Laika y los puntos de
    // Medellín siguen mencionados en el artículo de Pulzo. Si la página ya no
    // los menciona podría indicar que la campaña terminó o que el artículo
    // fue editado. No altera los datos curados; solo emite advertencias.
    const pageText = await fetchPageText(PRIMARY_URL);
    if (pageText) {
      const haystack = pageText.toLowerCase();
      for (const c of CENTERS) {
        const token = (c.verifyToken ?? c.name).toLowerCase();
        if (!haystack.includes(token)) {
          console.warn(
            `  [laika-mascotas] ADVERTENCIA: "${c.name}" (token "${c.verifyToken}") ya no aparece en la página. Verificar manualmente si la campaña sigue activa.`,
          );
        }
      }
    } else {
      console.warn(
        "  [laika-mascotas] Verificación de frescura omitida (página no descargable). Se devuelven los datos curados del 2026-06-30.",
      );
    }

    return CENTERS;
  },
};
