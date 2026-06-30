/**
 * Implementación del repositorio usando Postgres a través de Neon Serverless.
 *
 * Se usa en producción (Vercel + Neon). La conexión se obtiene de las
 * variables de entorno DATABASE_URL o POSTGRES_URL.
 *
 * Los materiales se almacenan como columna jsonb para simplicidad y flexibilidad.
 * Mapeo: snake_case en la DB → camelCase en TypeScript.
 */
import { neon } from "@neondatabase/serverless";

import type { Center, CenterInput, MaterialCategory } from "../types";
import type { CenterRepository, CreateMeta } from "./repository";

/** Fila tal como la retorna Postgres (snake_case). */
interface CenterRow {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  materials: MaterialCategory[]; // Postgres devuelve jsonb ya parseado por el driver
  schedule: string;
  lat: number;
  lng: number;
  notes: string | null;
  source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Convierte una fila de DB al tipo Center de la aplicación. */
function rowToCenter(row: CenterRow): Center {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    materials: Array.isArray(row.materials) ? row.materials : JSON.parse(row.materials as unknown as string),
    schedule: row.schedule,
    lat: Number(row.lat),
    lng: Number(row.lng),
    notes: row.notes,
    source: row.source,
    status: row.status as Center["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresStore implements CenterRepository {
  /**
   * La instancia `sql` de Neon actúa como cliente de Postgres.
   * Se crea una vez por instancia del store (singleton gestionado en index.ts).
   */
  private sql = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!);

  /**
   * Crea la tabla `centers` si no existe todavía.
   * Seguro de llamar múltiples veces (idempotente).
   */
  async init(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS centers (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        address      TEXT NOT NULL,
        phone        TEXT,
        materials    JSONB NOT NULL DEFAULT '[]',
        schedule     TEXT NOT NULL,
        lat          DOUBLE PRECISION NOT NULL,
        lng          DOUBLE PRECISION NOT NULL,
        notes        TEXT,
        source       TEXT,
        status       TEXT NOT NULL DEFAULT 'reportado',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  }

  /** Devuelve todos los centros ordenados del más reciente al más antiguo. */
  async list(): Promise<Center[]> {
    const rows = await this.sql`
      SELECT * FROM centers ORDER BY created_at DESC
    ` as CenterRow[];
    return rows.map(rowToCenter);
  }

  /** Busca un centro por id; devuelve null si no existe. */
  async getById(id: string): Promise<Center | null> {
    const rows = await this.sql`
      SELECT * FROM centers WHERE id = ${id} LIMIT 1
    ` as CenterRow[];
    return rows.length > 0 ? rowToCenter(rows[0]) : null;
  }

  /**
   * Inserta un nuevo centro y retorna el registro creado.
   * El id se genera como slug del nombre + sufijo UUID corto.
   */
  async create(input: CenterInput, meta?: CreateMeta): Promise<Center> {
    const id = `${toSlug(input.name)}-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const status = meta?.status ?? "reportado";
    const source = meta?.source ?? "reporte-ciudadano";
    const phone = input.phone ?? null;
    const notes = input.notes ?? null;
    const materials = JSON.stringify(input.materials);

    const rows = await this.sql`
      INSERT INTO centers
        (id, name, address, phone, materials, schedule, lat, lng, notes, source, status, created_at, updated_at)
      VALUES
        (${id}, ${input.name}, ${input.address}, ${phone}, ${materials}::jsonb,
         ${input.schedule}, ${input.lat}, ${input.lng}, ${notes}, ${source}, ${status},
         ${now}::timestamptz, ${now}::timestamptz)
      RETURNING *
    ` as CenterRow[];

    return rowToCenter(rows[0]);
  }

  /**
   * Upsert usado exclusivamente por el script de seed.
   * Respeta el id, status, source y timestamps del dato semilla.
   */
  async upsertFromSeed(center: Center): Promise<void> {
    const materials = JSON.stringify(center.materials);
    await this.sql`
      INSERT INTO centers
        (id, name, address, phone, materials, schedule, lat, lng, notes, source, status, created_at, updated_at)
      VALUES
        (${center.id}, ${center.name}, ${center.address}, ${center.phone ?? null},
         ${materials}::jsonb, ${center.schedule}, ${center.lat}, ${center.lng},
         ${center.notes ?? null}, ${center.source ?? null}, ${center.status},
         ${center.createdAt}::timestamptz, ${center.updatedAt}::timestamptz)
      ON CONFLICT (id) DO UPDATE SET
        name       = EXCLUDED.name,
        address    = EXCLUDED.address,
        phone      = EXCLUDED.phone,
        materials  = EXCLUDED.materials,
        schedule   = EXCLUDED.schedule,
        lat        = EXCLUDED.lat,
        lng        = EXCLUDED.lng,
        notes      = EXCLUDED.notes,
        source     = EXCLUDED.source,
        status     = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;
  }
}

// ---------------------------------------------------------------------------
// Utilidad local (no se exporta)
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
