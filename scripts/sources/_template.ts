/**
 * PLANTILLA de adaptador de fuente — guía para agregar una fuente nueva.
 * =====================================================================
 *
 * Este archivo NO se ejecuta (no está en el registro `index.ts`). Cópialo a
 * `scripts/sources/<mi-fuente>.ts`, renómbralo y adáptalo.
 *
 * Un "adaptador" sabe cómo sacar centros de acopio de UNA fuente pública
 * (una alcaldía, un medio, una ONG…). Devuelve `RawCenter[]`: datos crudos que
 * luego el orquestador (`scripts/scrape.ts`) normaliza a `Center`.
 *
 * REGLA DE ORO DEL PROYECTO (HONESTIDAD):
 *   - Esta es una app humanitaria real. Una dirección equivocada manda gente a
 *     un lugar equivocado. NO inventes centros, direcciones ni teléfonos.
 *   - Registra SOLO lo que la fuente publica, SIEMPRE con `sourceUrl` real.
 *   - Si dudas de un dato (dirección incompleta, conflicto entre fuentes),
 *     déjalo claro en `notes` y deja que el orquestador lo marque como
 *     "sin_verificar". Mejor poco y honesto que mucho e inventado.
 *
 * ---------------------------------------------------------------------------
 * DOS PATRONES SEGÚN CÓMO PUBLIQUE LA FUENTE
 * ---------------------------------------------------------------------------
 * (A) HTML ESTRUCTURADO (tablas, listas, tarjetas con clases CSS): se puede
 *     parsear de forma fiable con cheerio seleccionando nodos. Es el caso ideal
 *     y es el que ilustra esta plantilla más abajo.
 *
 * (B) PROSA (un artículo de prensa con las direcciones dentro del texto): un
 *     parser "ciego" con cheerio es FRÁGIL y PELIGROSO (puede mezclar una
 *     dirección con otra). En ese caso lo correcto es extraer los datos a mano,
 *     dejarlos como constantes con su `sourceUrl`, y usar cheerio solo para
 *     VERIFICAR que la página sigue mencionando esos centros. Mira
 *     `eltiempo-medellin.ts` como ejemplo real de este patrón (B).
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

/**
 * Descarga el HTML de una URL con `fetch` global (Node 20+).
 * Lanza si la respuesta no es 2xx para que el orquestador registre el error de
 * esta fuente sin abortar las demás.
 */
async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // Identifícate de forma honesta: ayuda a que los sitios no te bloqueen y
      // es lo correcto. Cambia el contacto por el real del proyecto.
      "User-Agent":
        "red-acopio-scraper/1.0 (proyecto humanitario; +https://github.com/)",
      "Accept-Language": "es-CO,es;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al descargar ${url}`);
  }
  return res.text();
}

export const templateSource: Source = {
  id: "mi-fuente", // slug corto y estable; nombra el archivo raw-mi-fuente.json
  label: "Mi Fuente (ciudad)", // se muestra en los logs
  url: "https://ejemplo.org/centros-de-acopio",

  async run(): Promise<RawCenter[]> {
    // 1) Descarga el HTML real.
    const html = await fetchHtml(this.url);

    // 2) Cárgalo en cheerio (API tipo jQuery del lado del servidor).
    const $ = cheerio.load(html);

    const centers: RawCenter[] = [];

    // 3) PATRÓN (A): recorre los nodos que contienen cada centro. Ajusta el
    //    selector a la estructura real de la página (inspecciónala antes).
    //    Ejemplo: una tabla con filas <tr>, o tarjetas <article class="card">.
    $("table.acopios tbody tr").each((_i, row) => {
      const $row = $(row);

      // Extrae cada celda/campo. `.text().trim()` evita espacios sobrantes.
      const name = $row.find("td.nombre").text().trim();
      const address = $row.find("td.direccion").text().trim();
      const phone = $row.find("td.telefono").text().trim();
      const schedule = $row.find("td.horario").text().trim();

      // Materiales: muchas veces vienen como una lista separada por comas.
      // Déjalos en TEXTO LIBRE; el orquestador los mapea a las categorías.
      const materialsText = $row.find("td.materiales").text().trim();
      const materials = materialsText
        ? materialsText.split(/[,;]/).map((m) => m.trim()).filter(Boolean)
        : undefined;

      // No registres filas vacías o sin nombre.
      if (!name) return;

      centers.push({
        name,
        address: address || undefined,
        phone: phone || undefined,
        materials,
        schedule: schedule || undefined,
        sourceUrl: this.url, // SIEMPRE la URL real
        municipality: "Medellín",
        // Si la dirección es buena, deja que el orquestador arme la geoQuery.
        // Si quieres afinar la precisión, pásala explícita:
        // geoQuery: `${address}, Medellín, Colombia`,
      });
    });

    // 4) Devuelve lo encontrado. Si no encontraste nada, devuelve [] (no inventes).
    return centers;
  },
};

/*
 * Para activar tu adaptador, impórtalo y agrégalo al array `sources` en
 * `scripts/sources/index.ts`. Luego corre `npm run scrape` y revisa
 * `data/scraped/raw-<id>.json` y `data/scraped/curados.json`.
 */
