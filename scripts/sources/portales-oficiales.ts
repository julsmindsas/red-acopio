/**
 * Monitor de portales oficiales de las zonas afectadas por el sismo del
 * 10 de agosto de 2026.
 *
 * POR QUÉ EXISTE
 * --------------
 * Al día del sismo, ninguna alcaldía ni la UNGRD habían publicado todavía un
 * listado estructurado de centros de acopio o albergues. Escribir hoy un parser
 * contra páginas que aún no existen produciría datos inventados — exactamente lo
 * que este proyecto se comprometió a no hacer.
 *
 * Este adaptador hace lo único honesto y útil mientras tanto: **rastrea los
 * portales oficiales y avisa por consola cuando aparecen publicaciones sobre
 * acopio, albergues o donaciones**, con su URL, para que una persona las lea y
 * cure los datos a mano (patrón B). Siempre devuelve `[]`: nunca crea centros a
 * partir de una coincidencia de palabras.
 *
 * Cuando una entidad publique una lista estructurada, el paso siguiente es
 * copiar `_template.ts` y escribir un adaptador dedicado para esa página.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

/** Portales que se revisan en cada corrida. */
const PORTALS: { label: string; url: string }[] = [
  { label: "Alcaldía de Manizales", url: "https://manizales.gov.co/" },
  { label: "Alcaldía de Pereira", url: "https://www.pereira.gov.co/" },
  { label: "Alcaldía de Cali", url: "https://www.cali.gov.co/" },
  { label: "Gobernación del Chocó", url: "https://www.choco.gov.co/" },
  { label: "UNGRD", url: "https://portal.gestiondelriesgo.gov.co/" },
];

/**
 * Señales de que una publicación puede contener puntos de ayuda.
 * En minúsculas y sin tildes: el texto se normaliza antes de comparar.
 */
const KEYWORDS = [
  "acopio",
  "albergue",
  "alojamiento temporal",
  "donacion",
  "donaciones",
  "damnificados",
  "ayuda humanitaria",
];

/** Minúsculas y sin diacríticos, para comparar sin sorpresas de acentuación. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "red-acopio-scraper/1.0 (proyecto humanitario; contacto: adminapps@julsmind.com)",
      "Accept-Language": "es-CO,es;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Enlaces del portal cuyo texto menciona alguna palabra clave. */
function findLeads(html: string, baseUrl: string): { text: string; href: string }[] {
  const $ = cheerio.load(html);
  const leads: { text: string; href: string }[] = [];
  const seen = new Set<string>();

  $("a").each((_i, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length < 12 || text.length > 200) return;

    const norm = normalize(text);
    if (!KEYWORDS.some((k) => norm.includes(k))) return;

    const rawHref = $(el).attr("href");
    if (!rawHref) return;

    // Resuelve rutas relativas contra el portal; descarta enlaces no navegables.
    let href: string;
    try {
      href = new URL(rawHref, baseUrl).toString();
    } catch {
      return;
    }
    if (seen.has(href)) return;
    seen.add(href);

    leads.push({ text, href });
  });

  return leads;
}

export const portalesOficiales: Source = {
  id: "portales-oficiales",
  label: "Monitor de portales oficiales (alcaldías + UNGRD)",
  url: "https://portal.gestiondelriesgo.gov.co/",

  async run(): Promise<RawCenter[]> {
    let totalLeads = 0;

    for (const portal of PORTALS) {
      try {
        const html = await fetchHtml(portal.url);
        const leads = findLeads(html, portal.url);

        if (leads.length === 0) {
          console.log(`    [monitor] ${portal.label}: sin publicaciones relevantes.`);
          continue;
        }

        totalLeads += leads.length;
        console.log(
          `    [monitor] ${portal.label}: ${leads.length} publicación(es) por revisar a mano:`,
        );
        for (const lead of leads) {
          console.log(`        · ${lead.text}\n          ${lead.href}`);
        }
      } catch (err) {
        console.warn(
          `    [monitor] ${portal.label}: no se pudo revisar (${(err as Error).message}).`,
        );
      }
    }

    if (totalLeads > 0) {
      console.log(
        `    [monitor] ${totalLeads} pista(s) en total. Revísalas y, si publican puntos concretos,\n` +
          `              cúralos a mano en un adaptador nuevo (copia scripts/sources/_template.ts).`,
      );
    }

    // Nunca se crean centros desde una coincidencia de palabras.
    return [];
  },
};
