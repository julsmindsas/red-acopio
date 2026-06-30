/**
 * Orquestador del scraper de Red de Acopio.
 * =========================================
 *
 * Ejecutar con:  npm run scrape   (alias de `tsx scripts/scrape.ts`)
 *
 * Qué hace, paso a paso:
 *   1. Recorre las fuentes activas (`scripts/sources/index.ts`) y ejecuta el
 *      `run()` de cada una. Si una falla, registra el error y SIGUE con las demás
 *      (no aborta todo).
 *   2. Guarda lo crudo de cada fuente en `data/scraped/raw-<id>.json`.
 *   3. Normaliza cada `RawCenter` -> `Center` del contrato (`@/lib/types`):
 *        - mapea materiales de texto libre a las categorías (`MaterialCategory`),
 *        - geocodifica la dirección a lat/lng (cache-first, luego Nominatim/OSM),
 *        - genera un `id` slug, asigna `status`, `source`, fechas y notas.
 *   4. Consolida todo en `data/scraped/curados.json` y muestra un resumen.
 *
 * Idempotente: volver a correrlo produce el mismo resultado (la geocodificación
 * usa un cache en `data/scraped/geocode-cache.json`).
 *
 * REGLA DE HONESTIDAD: no se inventan datos. Cada `Center` lleva su `source`
 * (URL real). Lo que la fuente no publica queda como "no publicado"/null, y las
 * ubicaciones aproximadas quedan marcadas en `notes`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { MATERIAL_CATEGORIES } from "@/lib/types";
import type { Center, MaterialCategory } from "@/lib/types";
import { sources } from "./sources/index";
import type { RawCenter } from "./sources/types";

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

/** Fecha fija de esta corrida de curado (ISO). El proyecto la fija al 2026-06-29. */
const FIXED_DATE = "2026-06-29T00:00:00.000Z";

const SCRAPED_DIR = path.join(process.cwd(), "data", "scraped");
const CURATED_FILE = path.join(SCRAPED_DIR, "curados.json");
const GEOCODE_CACHE_FILE = path.join(SCRAPED_DIR, "geocode-cache.json");

/** Centroides de respaldo por municipio (solo si la geocodificación falla del todo). */
const MUNICIPIO_FALLBACK: Record<string, { lat: number; lng: number }> = {
  "Medellín": { lat: 6.2476, lng: -75.5658 },
  "Itagüí": { lat: 6.1721, lng: -75.6116 },
  "Bello": { lat: 6.3378, lng: -75.5578 },
  "Envigado": { lat: 6.17, lng: -75.5847 },
};

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

function stripAccents(s: string): string {
  // Quita los signos diacríticos combinantes (U+0300–U+036F) tras normalizar.
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugify(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// ---------------------------------------------------------------------------
// Mapeo de materiales (texto libre -> MaterialCategory del contrato)
// ---------------------------------------------------------------------------

/**
 * Mapea UNA frase de material (ej. "alimentos no perecederos") a 0..n categorías.
 * Basado en palabras clave normalizadas (sin tildes, en minúsculas).
 */
function categoriesForPhrase(phrase: string): MaterialCategory[] {
  const p = stripAccents(phrase.toLowerCase());
  const out = new Set<MaterialCategory>();

  // "alimento para mascotas" -> otros (y NO alimentos): se trata aparte.
  if (p.includes("mascota")) {
    out.add("otros");
    return [...out];
  }

  if (p.includes("agua")) out.add("agua");
  if (p.includes("aliment")) out.add("alimentos");
  if (/(panal|formula|biberon|leche|infantil|\bbebe)/.test(p)) out.add("bebes");
  if (/(ropa|zapato|calzado|vestuario|abrigo)/.test(p)) {
    // "abrigo" puede ser prenda; el contrato lo agrupa en cobijas (abrigo/cobija).
    if (/(ropa|zapato|calzado|vestuario)/.test(p)) out.add("ropa");
  }
  if (/(abrigo|cobija|manta|frazada|cobertor|sabana)/.test(p)) out.add("cobijas");
  if (/(medic|curacion|antisep|primeros auxilios|farmac)/.test(p)) {
    out.add("medicamentos");
  }
  if (/(aseo|higiene|limpieza|toalla|sanitaria|jabon|panito)/.test(p)) {
    out.add("aseo");
  }
  if (p.includes("herramienta")) out.add("herramientas");
  if (/(colchoneta|carpa|linterna|bateria|proteccion|saco de dormir|toldillo)/.test(p)) {
    out.add("otros");
  }

  return [...out];
}

/** Mapea una lista de frases a categorías únicas, ordenadas como el contrato. */
function mapMaterials(phrases: string[]): MaterialCategory[] {
  const found = new Set<MaterialCategory>();
  for (const phrase of phrases) {
    for (const cat of categoriesForPhrase(phrase)) found.add(cat);
  }
  // Ordenar según MATERIAL_CATEGORIES para salida estable.
  return MATERIAL_CATEGORIES.filter((c) => found.has(c));
}

// ---------------------------------------------------------------------------
// Geocodificación (cache-first, luego Nominatim/OSM)
// ---------------------------------------------------------------------------

type Precision =
  | "poi"
  | "calle"
  | "barrio_centroide"
  | "barrio_aprox"
  | "municipio_fallback";

interface GeoEntry {
  lat: number;
  lng: number;
  precision: Precision;
  displayName?: string;
}

interface GeoCacheFile {
  _meta?: unknown;
  entries: Record<string, GeoEntry>;
}

let lastNominatimCall = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadGeoCache(): Promise<GeoCacheFile> {
  try {
    const raw = await fs.readFile(GEOCODE_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as GeoCacheFile;
    if (!parsed.entries) parsed.entries = {};
    return parsed;
  } catch {
    return { entries: {} };
  }
}

/** Clasifica la precisión de un resultado de Nominatim de forma conservadora. */
function classifyPrecision(result: {
  class?: string;
  type?: string;
  address?: { house_number?: string };
}): Precision {
  if (result.address?.house_number) return "calle";
  if (
    result.class === "place" &&
    ["suburb", "neighbourhood", "quarter", "city_district"].includes(
      result.type ?? "",
    )
  ) {
    return "barrio_centroide";
  }
  return "calle";
}

/**
 * Geocodifica una consulta. Primero mira el cache; si no está, llama a Nominatim
 * (máx. ~1 req/seg, con User-Agent honesto) y guarda el resultado en el cache.
 * Devuelve `null` si no hay resultado.
 */
async function geocode(
  query: string,
  cache: GeoCacheFile,
): Promise<GeoEntry | null> {
  const cached = cache.entries[query];
  if (cached) return cached;

  // Respetar el uso responsable de Nominatim: una consulta por segundo.
  const since = Date.now() - lastNominatimCall;
  if (since < 1100) await sleep(1100 - since);

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "red-acopio-scraper/1.0 (proyecto humanitario; contacto: adminapps@julsmind.com)",
        "Accept-Language": "es-CO,es;q=0.9",
      },
    });
    lastNominatimCall = Date.now();
    if (!res.ok) {
      console.warn(`    [geo] HTTP ${res.status} para "${query}"`);
      return null;
    }
    const arr = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
      class?: string;
      type?: string;
      address?: { house_number?: string };
    }>;
    if (!arr.length) return null;

    const r = arr[0];
    const entry: GeoEntry = {
      lat: Number(r.lat),
      lng: Number(r.lon),
      precision: classifyPrecision(r),
      displayName: r.display_name,
    };
    cache.entries[query] = entry; // se persiste al final
    return entry;
  } catch (err) {
    console.warn(`    [geo] Error geocodificando "${query}": ${(err as Error).message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalización RawCenter -> Center
// ---------------------------------------------------------------------------

/** Texto de nota según la precisión de la geocodificación. */
function geoNote(precision: Precision): string {
  switch (precision) {
    case "poi":
      return "Geocodificación: punto exacto (POI) vía Nominatim/OSM, 2026-06-29.";
    case "calle":
      return "Geocodificación a nivel de calle vía Nominatim/OSM, 2026-06-29 (no a número de puerta exacto).";
    case "barrio_centroide":
      return "Ubicación APROXIMADA (centroide del barrio) vía Nominatim/OSM, 2026-06-29: la fuente no publicó dirección exacta.";
    case "barrio_aprox":
      return "Ubicación APROXIMADA vía Nominatim/OSM, 2026-06-29: no se ubicó la dirección exacta; punto aproximado dentro del barrio.";
    case "municipio_fallback":
      return "Ubicación MUY APROXIMADA (centro del municipio): no se pudo geocodificar la dirección.";
  }
}

interface NormalizeResult {
  center: Center;
  geocoded: boolean;
  precision: Precision;
}

async function normalize(
  raw: RawCenter,
  usedIds: Set<string>,
  cache: GeoCacheFile,
): Promise<NormalizeResult> {
  // ---- id único (slug del nombre) ----
  let id = slugify(raw.name) || "centro";
  if (usedIds.has(id)) {
    let n = 2;
    while (usedIds.has(`${id}-${n}`)) n++;
    id = `${id}-${n}`;
  }
  usedIds.add(id);

  // ---- materiales ----
  let materials = mapMaterials(raw.materials ?? []);
  if (materials.length === 0) materials = ["otros"];

  // ---- geocodificación ----
  const query =
    raw.geoQuery ??
    `${raw.address ?? raw.name}, ${raw.municipality ?? "Medellín"}, Colombia`;

  let lat: number;
  let lng: number;
  let precision: Precision;
  let geocoded = true;

  if (typeof raw.lat === "number" && typeof raw.lng === "number") {
    // La fuente ya trae coordenadas: se respetan.
    lat = raw.lat;
    lng = raw.lng;
    precision = "calle";
  } else {
    const geo = await geocode(query, cache);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      precision = geo.precision;
    } else {
      // Fallback honesto: centroide del municipio, claramente marcado.
      const fb = MUNICIPIO_FALLBACK[raw.municipality ?? "Medellín"] ?? MUNICIPIO_FALLBACK["Medellín"];
      lat = fb.lat;
      lng = fb.lng;
      precision = "municipio_fallback";
      geocoded = false;
    }
  }

  // ---- notas ----
  const noteParts: string[] = [];
  if (raw.notes) noteParts.push(raw.notes);
  noteParts.push(geoNote(precision));
  const notes = noteParts.length ? noteParts.join(" ") : null;

  const center: Center = {
    id,
    name: raw.name,
    address: raw.address ?? "Dirección no publicada",
    phone: raw.phone ?? null,
    materials,
    schedule: raw.schedule ?? "Horario no publicado",
    lat,
    lng,
    notes,
    source: raw.sourceUrl,
    // Es scraping de prensa: por defecto "sin_verificar". Solo se subiría a
    // "verificado" si la fuente fuera oficial (gobierno/Cruz Roja) y listara
    // explícitamente el centro; no es el caso de ninguna fuente activa.
    status: "sin_verificar",
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };

  return { center, geocoded, precision };
}

// ---------------------------------------------------------------------------
// Orquestación principal
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("== Red de Acopio · scraper ==");
  console.log(`Fuentes activas: ${sources.length}`);
  await fs.mkdir(SCRAPED_DIR, { recursive: true });

  const cache = await loadGeoCache();
  const usedIds = new Set<string>();
  const allCenters: Center[] = [];

  let totalRaw = 0;
  let totalGeocoded = 0;
  const perSource: Array<{ id: string; raw: number; ok: number }> = [];

  for (const source of sources) {
    console.log(`\n-> Fuente: ${source.label} [${source.id}]`);
    let rawCenters: RawCenter[] = [];
    try {
      rawCenters = await source.run();
    } catch (err) {
      // Una fuente que falla no debe tumbar a las demás.
      console.error(`   ERROR ejecutando la fuente "${source.id}": ${(err as Error).message}`);
      perSource.push({ id: source.id, raw: 0, ok: 0 });
      continue;
    }

    // Guardar lo crudo (auditoría / reprocesamiento).
    const rawPath = path.join(SCRAPED_DIR, `raw-${source.id}.json`);
    await fs.writeFile(rawPath, JSON.stringify(rawCenters, null, 2) + "\n", "utf8");
    console.log(`   ${rawCenters.length} centro(s) crudos -> ${path.relative(process.cwd(), rawPath)}`);
    totalRaw += rawCenters.length;

    let okThisSource = 0;
    for (const raw of rawCenters) {
      try {
        const { center, geocoded } = await normalize(raw, usedIds, cache);
        allCenters.push(center);
        okThisSource++;
        if (geocoded) totalGeocoded++;
      } catch (err) {
        console.error(`   ERROR normalizando "${raw.name}": ${(err as Error).message}`);
      }
    }
    perSource.push({ id: source.id, raw: rawCenters.length, ok: okThisSource });
  }

  // Persistir el cache de geocodificación (si se agregaron entradas nuevas).
  try {
    await fs.writeFile(
      GEOCODE_CACHE_FILE,
      JSON.stringify(cache, null, 2) + "\n",
      "utf8",
    );
  } catch (err) {
    console.warn(`   No se pudo guardar el cache de geo: ${(err as Error).message}`);
  }

  // Escribir el curado consolidado.
  await fs.writeFile(
    CURATED_FILE,
    JSON.stringify(allCenters, null, 2) + "\n",
    "utf8",
  );

  // ---- Resumen ----
  const verificados = allCenters.filter((c) => c.status === "verificado").length;
  const sinVerificar = allCenters.filter((c) => c.status === "sin_verificar").length;

  console.log("\n== Resumen ==");
  for (const s of perSource) {
    console.log(`  · ${s.id}: ${s.ok}/${s.raw} normalizados`);
  }
  console.log(`  Total crudos:        ${totalRaw}`);
  console.log(`  Total curados:       ${allCenters.length}`);
  console.log(`  Geocodificados:      ${totalGeocoded}/${allCenters.length}`);
  console.log(`  verificado:          ${verificados}`);
  console.log(`  sin_verificar:       ${sinVerificar}`);
  console.log(`  Salida:              ${path.relative(process.cwd(), CURATED_FILE)}`);
  if (allCenters.length === 0) {
    console.log("\n  (Sin centros reales: revisa docs/fuentes.md para el detalle.)");
  }
}

main().catch((err) => {
  console.error("Fallo fatal del scraper:", err);
  process.exitCode = 1;
});
