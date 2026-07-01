/**
 * Cliente de la API oficial de acopiove.org (terremotovenezuela.app).
 *
 * Consume el endpoint público `/api/acopio` filtrado a Colombia y mapea su
 * esquema al tipo `Center` de nuestra app, marcándolos como `readOnly` (no se
 * editan desde nuestro panel; su fuente es la plataforma oficial).
 *
 * Estrategia "no redundar": en vez de mantener nuestra propia base de centros,
 * consumimos la fuente autoritativa (verificada y deduplicada por ellos) y solo
 * complementamos con nuestros aportes locales (ver lib/centers-source.ts).
 */
import { neon } from "@neondatabase/serverless";
import type { Center, MaterialCategory, VerificationStatus } from "./types";

const API_BASE =
  process.env.ACOPIO_API_BASE || "https://api.terremotovenezuela.app";
const COUNTRY = process.env.ACOPIO_COUNTRY || "Colombia";

/** Mapea las categorías de la API oficial (en inglés) a nuestras MaterialCategory. */
const ACCEPTS_MAP: Record<string, MaterialCategory> = {
  food: "alimentos",
  water: "agua",
  clothing: "ropa",
  medicines: "medicamentos",
  medical_supplies: "medicamentos",
  hygiene: "aseo",
  shelter: "cobijas",
  baby: "bebes",
  tools: "herramientas",
  pets: "mascotas",
  pet_food: "mascotas",
  animals: "mascotas",
};

/** Forma (parcial) de un acopio según la API oficial. */
interface OfficialAcopio {
  id: string;
  name: string;
  manager?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  accepts?: string[] | null;
  contact?: string | null;
  schedule?: string | null;
  status?: string | null;
  verificationLevel?: string | null;
  disputed?: boolean | null;
  description?: string | null;
}

interface OfficialResponse {
  items?: OfficialAcopio[];
  total?: number;
}

function mapMaterials(accepts: string[] | null | undefined): MaterialCategory[] {
  if (!accepts) return [];
  const out = new Set<MaterialCategory>();
  for (const a of accepts) {
    const mapped = ACCEPTS_MAP[String(a).toLowerCase()];
    out.add(mapped ?? "otros");
  }
  return [...out];
}

function mapStatus(a: OfficialAcopio): VerificationStatus {
  if (a.disputed) return "sin_verificar";
  return a.verificationLevel === "verified" ? "verificado" : "sin_verificar";
}

/** Convierte un acopio oficial al tipo Center de nuestra app. */
function toCenter(a: OfficialAcopio, nowIso: string): Center | null {
  if (typeof a.lat !== "number" || typeof a.lng !== "number") return null;
  const manager = a.manager ? `Gestiona: ${a.manager}. ` : "";
  const desc = a.description ? `${a.description}. ` : "";
  return {
    id: `acopio-${a.id}`,
    name: a.name,
    address: a.address || a.city || "Colombia",
    phone: a.contact || null,
    materials: mapMaterials(a.accepts),
    schedule: a.schedule || "Horario no publicado",
    lat: a.lat,
    lng: a.lng,
    city: a.city ?? null,
    country: a.country ?? COUNTRY,
    notes: `${manager}${desc}Fuente: acopiove.org`.trim(),
    source: "acopiove.org",
    status: mapStatus(a),
    readOnly: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// Caché simple en memoria (vive mientras la instancia serverless esté tibia).
let cache: { at: number; data: Center[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ---------------------------------------------------------------------------
// Snapshot persistente en Postgres (resiliencia ante caídas de la API oficial)
// ---------------------------------------------------------------------------
// La caché en memoria se pierde en instancias serverless frías. Para que una
// caída de la API oficial NO nos deje solo con los datos locales, guardamos la
// última copia buena de los centros oficiales en nuestra base y la servimos
// como último recurso cuando la API oficial no responde.

function getSql(): ReturnType<typeof neon> | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

let snapInit: Promise<void> | null = null;
function ensureSnapInit(sql: ReturnType<typeof neon>): Promise<void> {
  if (!snapInit) {
    snapInit = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS official_snapshot (
          id integer PRIMARY KEY,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return snapInit;
}

/** Guarda la última copia buena de los centros oficiales (fire-and-forget). */
async function saveSnapshot(centers: Center[]): Promise<void> {
  const sql = getSql();
  if (!sql || centers.length === 0) return; // nunca sobreescribir con vacío
  try {
    await ensureSnapInit(sql);
    await sql`
      INSERT INTO official_snapshot (id, data, updated_at)
      VALUES (1, ${JSON.stringify(centers)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
  } catch (err) {
    console.error("[acopio-api] saveSnapshot falló:", err);
  }
}

/** Carga la última copia buena guardada (o [] si no hay). */
async function loadSnapshot(): Promise<Center[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSnapInit(sql);
    const rows = (await sql`SELECT data FROM official_snapshot WHERE id = 1`) as {
      data: Center[];
    }[];
    return rows[0]?.data ?? [];
  } catch (err) {
    console.error("[acopio-api] loadSnapshot falló:", err);
    return [];
  }
}

/**
 * Obtiene los centros oficiales de Colombia, mapeados a `Center`.
 * Ante cualquier fallo (red, formato), devuelve [] para que la app degrade con
 * elegancia a los datos locales en vez de romperse.
 */
export async function fetchOfficialCenters(
  opts: { force?: boolean } = {},
): Promise<Center[]> {
  const now = Date.now();
  if (!opts.force && cache && now - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const url = `${API_BASE}/api/acopio?country=${encodeURIComponent(COUNTRY)}&limit=500`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "red-acopio/1.0" },
      // Revalida en el servidor cada 5 min.
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = (await res.json()) as OfficialResponse | OfficialAcopio[];
    const items = Array.isArray(json) ? json : json.items ?? [];
    const nowIso = new Date(now).toISOString();
    const centers = items
      .map((a) => toCenter(a, nowIso))
      .filter((c): c is Center => c !== null);

    cache = { at: now, data: centers };
    // Persiste la última copia buena para sobrevivir caídas futuras (no bloquea).
    void saveSnapshot(centers);
    return centers;
  } catch (err) {
    console.error("[acopio-api] no se pudo obtener la API oficial:", err);
    // Degrada en cascada: 1) caché en memoria, 2) snapshot persistente en DB,
    // 3) vacío (la app seguirá con los centros locales).
    if (cache?.data?.length) return cache.data;
    return await loadSnapshot();
  }
}
