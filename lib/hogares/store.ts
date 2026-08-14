/**
 * Capa de datos de "Hogares de Paso" (patrón Repository, igual que lib/db).
 *
 * Dos implementaciones seleccionadas por entorno, con la misma regla que
 * lib/db/index.ts:
 *   - DATABASE_URL o POSTGRES_URL presentes → HogaresPostgresStore (Neon).
 *   - De lo contrario → HogaresJsonStore (archivo local, cero configuración).
 *
 * OJO con lo que guarda este módulo: nombre, teléfono, documento y dirección
 * son datos sensibles. El store los persiste completos porque el equipo
 * coordinador los necesita para verificar y emparejar, pero NINGUNA ruta
 * pública debe devolverlos: eso lo garantiza `toHogarPublico()` en las rutas.
 */
import type {
  Hogar,
  HogarPatch,
  Seguimiento,
  SolicitudHogar,
  SolicitudPatch,
} from "./types";
import {
  seguimientoSchema,
  type ValidatedHogarInput,
  type ValidatedSolicitudInput,
} from "./validation";

/**
 * Patch de solicitud tal como lo usa el SERVIDOR (rutas → store).
 *
 * `hospedadaAt` NO está en `SolicitudPatch` a propósito: el cliente jamás
 * puede fijar la fecha de llegada (el zod `.strict()` del PATCH lo rechaza).
 * Solo la ruta lo añade con el reloj del servidor al pasar a "hospedada", y
 * el store lo aplica con semántica de "sellar una sola vez": si la solicitud
 * ya tenía fecha, se conserva la original.
 */
export type SolicitudPatchServidor = SolicitudPatch & {
  hospedadaAt?: string;
};

/** Contrato acordado con el resto de la app. No cambiar sin coordinar. */
export interface HogaresRepository {
  init(): Promise<void>;
  listHogares(): Promise<Hogar[]>;
  getHogarById(id: string): Promise<Hogar | null>;
  createHogar(input: ValidatedHogarInput): Promise<Hogar>;
  updateHogar(id: string, patch: HogarPatch): Promise<Hogar | null>;
  removeHogar(id: string): Promise<boolean>;
  listSolicitudes(): Promise<SolicitudHogar[]>;
  createSolicitud(input: ValidatedSolicitudInput): Promise<SolicitudHogar>;
  updateSolicitud(
    id: string,
    patch: SolicitudPatchServidor,
  ): Promise<SolicitudHogar | null>;
}

// ---------------------------------------------------------------------------
// Utilidades compartidas por ambas implementaciones
// ---------------------------------------------------------------------------

/**
 * Convierte "" / undefined en null. Los esquemas zod aceptan cadena vacía en
 * los campos opcionales (así los formularios no pelean con inputs vacíos),
 * pero en almacenamiento queremos null explícito, como hace el store de centros.
 */
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Ids opacos SIN el nombre de la persona. Los centros usan slug del nombre en
 * el id porque son sitios públicos; aquí el nombre es un dato privado y no
 * debe filtrarse ni siquiera por el identificador.
 */
function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Construye un Hogar completo a partir de la entrada validada. */
function buildHogar(input: ValidatedHogarInput): Hogar {
  const now = new Date().toISOString();
  return {
    id: newId("hogar"),
    nombre: input.nombre,
    telefono: input.telefono,
    email: input.email,
    documento: emptyToNull(input.documento),
    direccion: emptyToNull(input.direccion),
    ciudad: input.ciudad,
    zona: emptyToNull(input.zona),
    capacidad: input.capacidad,
    acepta: input.acepta,
    ofrece: input.ofrece ?? [],
    duracion: input.duracion,
    convivencia: input.convivencia,
    notas: emptyToNull(input.notas),
    // Nadie nace verificado: la publicación depende de la llamada del equipo.
    verificacion: "pendiente",
    disponibilidad: "disponible",
    createdAt: now,
    updatedAt: now,
  };
}

/** Construye una SolicitudHogar completa a partir de la entrada validada. */
function buildSolicitud(input: ValidatedSolicitudInput): SolicitudHogar {
  const now = new Date().toISOString();
  return {
    id: newId("solicitud"),
    nombre: input.nombre,
    telefono: input.telefono,
    email: emptyToNull(input.email),
    ciudad: input.ciudad,
    personas: input.personas,
    composicion: input.composicion,
    preferencias: input.preferencias ?? [],
    hogarInteresId: input.hogarInteresId ?? null,
    notas: emptyToNull(input.notas),
    estado: "nueva",
    hogarId: null,
    codigoVerificacion: null,
    // Nadie nace hospedado: la fecha de llegada la sella el servidor cuando
    // el equipo confirma que la persona llegó, y los seguimientos empiezan vacíos.
    hospedadaAt: null,
    seguimientos: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Valida los seguimientos leídos del almacenamiento con el mismo esquema zod
 * del PATCH: un registro corrupto (editado a mano, versión vieja) se descarta
 * en vez de romper el cálculo de `seguimientoPendiente`.
 */
function normalizeSeguimientos(value: unknown): Seguimiento[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = seguimientoSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * Normaliza un hogar leído del almacenamiento: registros de versiones
 * anteriores (o editados a mano) pueden traer campos ausentes.
 */
function normalizeHogar(raw: Partial<Hogar> & { id: string }): Hogar {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    telefono: raw.telefono ?? "",
    // Registros anteriores al flujo de correo: sin canal de notificación.
    email: raw.email ?? null,
    documento: raw.documento ?? null,
    direccion: raw.direccion ?? null,
    ciudad: raw.ciudad ?? "",
    zona: raw.zona ?? null,
    capacidad: typeof raw.capacidad === "number" ? raw.capacidad : 1,
    acepta: Array.isArray(raw.acepta) ? raw.acepta : [],
    ofrece: Array.isArray(raw.ofrece) ? raw.ofrece : [],
    duracion: raw.duracion ?? "dias",
    convivencia: raw.convivencia ?? "varias_personas",
    notas: raw.notas ?? null,
    // Ante la duda, lo más restrictivo: sin verificar y en pausa un hogar
    // jamás se publica por accidente.
    disponibilidad: raw.disponibilidad ?? "pausado",
    verificacion: raw.verificacion ?? "pendiente",
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

/** Normaliza una solicitud leída del almacenamiento. */
function normalizeSolicitud(
  raw: Partial<SolicitudHogar> & { id: string },
): SolicitudHogar {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    telefono: raw.telefono ?? "",
    email: raw.email ?? null,
    ciudad: raw.ciudad ?? "",
    personas: typeof raw.personas === "number" ? raw.personas : 1,
    composicion: Array.isArray(raw.composicion) ? raw.composicion : [],
    preferencias: Array.isArray(raw.preferencias) ? raw.preferencias : [],
    hogarInteresId: raw.hogarInteresId ?? null,
    notas: raw.notas ?? null,
    estado: raw.estado ?? "nueva",
    hogarId: raw.hogarId ?? null,
    codigoVerificacion: raw.codigoVerificacion ?? null,
    // Registros anteriores a los seguimientos: sin fecha de llegada conocida
    // y sin llamadas registradas.
    hospedadaAt: typeof raw.hospedadaAt === "string" ? raw.hospedadaAt : null,
    seguimientos: normalizeSeguimientos(raw.seguimientos),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

/** Aplica un HogarPatch sobre un hogar existente (solo campos presentes). */
function applyHogarPatch(existing: Hogar, patch: HogarPatch): Hogar {
  return {
    ...existing,
    ...(patch.zona !== undefined && { zona: emptyToNull(patch.zona) }),
    ...(patch.capacidad !== undefined && { capacidad: patch.capacidad }),
    ...(patch.acepta !== undefined && { acepta: patch.acepta }),
    ...(patch.ofrece !== undefined && { ofrece: patch.ofrece }),
    ...(patch.duracion !== undefined && { duracion: patch.duracion }),
    ...(patch.convivencia !== undefined && { convivencia: patch.convivencia }),
    ...(patch.notas !== undefined && { notas: emptyToNull(patch.notas) }),
    ...(patch.disponibilidad !== undefined && {
      disponibilidad: patch.disponibilidad,
    }),
    ...(patch.verificacion !== undefined && {
      verificacion: patch.verificacion,
    }),
    updatedAt: new Date().toISOString(),
  };
}

/** Aplica un SolicitudPatch sobre una solicitud existente. */
function applySolicitudPatch(
  existing: SolicitudHogar,
  patch: SolicitudPatchServidor,
): SolicitudHogar {
  return {
    ...existing,
    ...(patch.estado !== undefined && { estado: patch.estado }),
    ...(patch.hogarId !== undefined && { hogarId: patch.hogarId }),
    ...(patch.codigoVerificacion !== undefined && {
      codigoVerificacion: patch.codigoVerificacion,
    }),
    ...(patch.notas !== undefined && { notas: emptyToNull(patch.notas) }),
    // Sello de llegada: se escribe UNA sola vez. Si la solicitud ya tenía
    // fecha, se conserva la original — de ella dependen los hitos de 48h/7d.
    ...(patch.hospedadaAt !== undefined && {
      hospedadaAt: existing.hospedadaAt ?? patch.hospedadaAt,
    }),
    // Reemplazo total de la lista de seguimientos (contrato de SolicitudPatch).
    ...(patch.seguimientos !== undefined && {
      seguimientos: patch.seguimientos,
    }),
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Implementación 1: archivo JSON local (desarrollo)
// ---------------------------------------------------------------------------

/** Forma del archivo data/hogares.local.json. */
interface HogaresFile {
  hogares: Hogar[];
  solicitudes: SolicitudHogar[];
}

/**
 * Store basado en un único archivo JSON con ambas colecciones. EXCLUSIVO para
 * entorno local: en Vercel el FS es efímero. Si el FS no permite escribir,
 * opera en modo solo lectura (listas vacías, mutaciones con error claro),
 * igual que el JsonStore de centros.
 */
class HogaresJsonStore implements HogaresRepository {
  // Ruta acotada al subdirectorio "data" (segmento literal separado) para que
  // el trazador de archivos de Next no arrastre el proyecto completo.
  private localPath = "";
  private readOnly = false;

  async init(): Promise<void> {
    const path = await import("path");
    const fs = await import("fs/promises");
    this.localPath = path.join(process.cwd(), "data", "hogares.local.json");
    try {
      await fs.access(this.localPath);
    } catch {
      // No existe: lo creamos vacío. No hay semilla — los hogares son datos
      // personales reales, no tiene sentido versionarlos en el repo.
      try {
        await fs.mkdir(path.dirname(this.localPath), { recursive: true });
        const empty: HogaresFile = { hogares: [], solicitudes: [] };
        await fs.writeFile(
          this.localPath,
          JSON.stringify(empty, null, 2),
          "utf-8",
        );
      } catch {
        this.readOnly = true;
      }
    }
  }

  private async readFile(): Promise<HogaresFile> {
    if (this.readOnly) return { hogares: [], solicitudes: [] };
    const fs = await import("fs/promises");
    const raw = await fs.readFile(this.localPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<HogaresFile>;
    return {
      hogares: (parsed.hogares ?? []).map(normalizeHogar),
      solicitudes: (parsed.solicitudes ?? []).map(normalizeSolicitud),
    };
  }

  private async writeFile(data: HogaresFile): Promise<void> {
    if (this.readOnly) {
      throw new Error(
        "READ_ONLY_STORE: el almacenamiento es de solo lectura en este entorno. " +
          "Configura DATABASE_URL o POSTGRES_URL (Postgres/Neon) para habilitar Hogares de Paso.",
      );
    }
    const fs = await import("fs/promises");
    await fs.writeFile(
      this.localPath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  }

  async listHogares(): Promise<Hogar[]> {
    const { hogares } = await this.readFile();
    // Del más reciente al más antiguo, como los centros.
    return hogares.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getHogarById(id: string): Promise<Hogar | null> {
    const { hogares } = await this.readFile();
    return hogares.find((h) => h.id === id) ?? null;
  }

  async createHogar(input: ValidatedHogarInput): Promise<Hogar> {
    const data = await this.readFile();
    const hogar = buildHogar(input);
    data.hogares.push(hogar);
    await this.writeFile(data);
    return hogar;
  }

  async updateHogar(id: string, patch: HogarPatch): Promise<Hogar | null> {
    const data = await this.readFile();
    const idx = data.hogares.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    const updated = applyHogarPatch(data.hogares[idx], patch);
    data.hogares[idx] = updated;
    await this.writeFile(data);
    return updated;
  }

  async removeHogar(id: string): Promise<boolean> {
    const data = await this.readFile();
    const before = data.hogares.length;
    data.hogares = data.hogares.filter((h) => h.id !== id);
    const existed = data.hogares.length < before;
    if (existed) await this.writeFile(data);
    return existed;
  }

  async listSolicitudes(): Promise<SolicitudHogar[]> {
    const { solicitudes } = await this.readFile();
    return solicitudes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createSolicitud(
    input: ValidatedSolicitudInput,
  ): Promise<SolicitudHogar> {
    const data = await this.readFile();
    const solicitud = buildSolicitud(input);
    data.solicitudes.push(solicitud);
    await this.writeFile(data);
    return solicitud;
  }

  async updateSolicitud(
    id: string,
    patch: SolicitudPatchServidor,
  ): Promise<SolicitudHogar | null> {
    const data = await this.readFile();
    const idx = data.solicitudes.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = applySolicitudPatch(data.solicitudes[idx], patch);
    data.solicitudes[idx] = updated;
    await this.writeFile(data);
    return updated;
  }
}

// ---------------------------------------------------------------------------
// Implementación 2: Postgres/Neon (producción)
// ---------------------------------------------------------------------------

/** Fila de la tabla `hogares` tal como la retorna Postgres (snake_case). */
interface HogarRow {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  documento: string | null;
  direccion: string | null;
  ciudad: string;
  zona: string | null;
  capacidad: number;
  acepta: unknown;
  ofrece: unknown;
  duracion: string;
  convivencia: string;
  notas: string | null;
  disponibilidad: string;
  verificacion: string;
  created_at: string;
  updated_at: string;
}

/** Fila de la tabla `solicitudes_hogar`. */
interface SolicitudRow {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  ciudad: string;
  personas: number;
  composicion: unknown;
  preferencias: unknown;
  hogar_interes_id: string | null;
  notas: string | null;
  estado: string;
  hogar_id: string | null;
  codigo_verificacion: string | null;
  hospedada_at: string | null;
  seguimientos: unknown;
  created_at: string;
  updated_at: string;
}

/** Lee una columna jsonb que puede venir nula o como texto. */
function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToHogar(row: HogarRow): Hogar {
  // normalizeHogar hace el trabajo pesado de defaults; aquí solo mapeamos
  // snake_case → camelCase y parseamos los jsonb.
  return normalizeHogar({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email,
    documento: row.documento,
    direccion: row.direccion,
    ciudad: row.ciudad,
    zona: row.zona,
    capacidad: Number(row.capacidad),
    acepta: parseJsonArray(row.acepta),
    ofrece: parseJsonArray(row.ofrece),
    duracion: row.duracion as Hogar["duracion"],
    convivencia: row.convivencia as Hogar["convivencia"],
    notas: row.notas,
    disponibilidad: row.disponibilidad as Hogar["disponibilidad"],
    verificacion: row.verificacion as Hogar["verificacion"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function rowToSolicitud(row: SolicitudRow): SolicitudHogar {
  return normalizeSolicitud({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email,
    ciudad: row.ciudad,
    personas: Number(row.personas),
    composicion: parseJsonArray(row.composicion),
    preferencias: parseJsonArray(row.preferencias),
    hogarInteresId: row.hogar_interes_id,
    notas: row.notas,
    estado: row.estado as SolicitudHogar["estado"],
    hogarId: row.hogar_id,
    codigoVerificacion: row.codigo_verificacion,
    // Se re-serializa a ISO canónico: el driver puede devolver el timestamptz
    // en formato Postgres, y de esta fecha se hacen cuentas en el cliente.
    hospedadaAt: row.hospedada_at
      ? new Date(row.hospedada_at).toISOString()
      : null,
    seguimientos: parseJsonArray(row.seguimientos),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

/**
 * Store sobre Postgres (Neon serverless), mismo estilo que PostgresStore de
 * centros: CREATE TABLE IF NOT EXISTS idempotente en init(), jsonb para las
 * listas, valores siempre parametrizados.
 */
class HogaresPostgresStore implements HogaresRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sql: any = null;

  private async client() {
    if (!this.sql) {
      const { neon } = await import("@neondatabase/serverless");
      this.sql = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL!);
    }
    return this.sql;
  }

  async init(): Promise<void> {
    const sql = await this.client();
    await sql`
      CREATE TABLE IF NOT EXISTS hogares (
        id             TEXT PRIMARY KEY,
        nombre         TEXT NOT NULL,
        telefono       TEXT NOT NULL,
        email          TEXT,
        documento      TEXT,
        direccion      TEXT,
        ciudad         TEXT NOT NULL,
        zona           TEXT,
        capacidad      INTEGER NOT NULL DEFAULT 1,
        acepta         JSONB NOT NULL DEFAULT '[]',
        ofrece         JSONB NOT NULL DEFAULT '[]',
        duracion       TEXT NOT NULL DEFAULT 'dias',
        convivencia    TEXT NOT NULL DEFAULT 'varias_personas',
        notas          TEXT,
        disponibilidad TEXT NOT NULL DEFAULT 'disponible',
        verificacion   TEXT NOT NULL DEFAULT 'pendiente',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS solicitudes_hogar (
        id                  TEXT PRIMARY KEY,
        nombre              TEXT NOT NULL,
        telefono            TEXT NOT NULL,
        email               TEXT,
        ciudad              TEXT NOT NULL,
        personas            INTEGER NOT NULL DEFAULT 1,
        composicion         JSONB NOT NULL DEFAULT '[]',
        preferencias        JSONB NOT NULL DEFAULT '[]',
        hogar_interes_id    TEXT,
        notas               TEXT,
        estado              TEXT NOT NULL DEFAULT 'nueva',
        hogar_id            TEXT,
        codigo_verificacion TEXT,
        hospedada_at        TIMESTAMPTZ,
        seguimientos        JSONB NOT NULL DEFAULT '[]',
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Migración para la base YA desplegada (Neon): la tabla existe sin estas
    // columnas y el CREATE TABLE IF NOT EXISTS de arriba no la toca. ADD COLUMN
    // IF NOT EXISTS es idempotente, así que puede correr en cada arranque sin
    // fallar ni duplicar nada. Mismos tipos y defaults que el CREATE para que
    // instalaciones nuevas y viejas queden idénticas.
    await sql`
      ALTER TABLE solicitudes_hogar
        ADD COLUMN IF NOT EXISTS hospedada_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE solicitudes_hogar
        ADD COLUMN IF NOT EXISTS seguimientos JSONB NOT NULL DEFAULT '[]'
    `;
    // Flujo de correo al anfitrión (aceptar/rechazar por enlace firmado).
    await sql`
      ALTER TABLE hogares
        ADD COLUMN IF NOT EXISTS email TEXT
    `;
    await sql`
      ALTER TABLE solicitudes_hogar
        ADD COLUMN IF NOT EXISTS email TEXT
    `;
    await sql`
      ALTER TABLE solicitudes_hogar
        ADD COLUMN IF NOT EXISTS hogar_interes_id TEXT
    `;
  }

  async listHogares(): Promise<Hogar[]> {
    const sql = await this.client();
    const rows = (await sql`
      SELECT * FROM hogares ORDER BY created_at DESC
    `) as HogarRow[];
    return rows.map(rowToHogar);
  }

  async getHogarById(id: string): Promise<Hogar | null> {
    const sql = await this.client();
    const rows = (await sql`
      SELECT * FROM hogares WHERE id = ${id} LIMIT 1
    `) as HogarRow[];
    return rows.length > 0 ? rowToHogar(rows[0]) : null;
  }

  async createHogar(input: ValidatedHogarInput): Promise<Hogar> {
    const sql = await this.client();
    const h = buildHogar(input);
    const rows = (await sql`
      INSERT INTO hogares
        (id, nombre, telefono, email, documento, direccion, ciudad, zona,
         capacidad, acepta, ofrece, duracion, convivencia, notas,
         disponibilidad, verificacion, created_at, updated_at)
      VALUES
        (${h.id}, ${h.nombre}, ${h.telefono}, ${h.email}, ${h.documento},
         ${h.direccion}, ${h.ciudad}, ${h.zona}, ${h.capacidad},
         ${JSON.stringify(h.acepta)}::jsonb, ${JSON.stringify(h.ofrece)}::jsonb,
         ${h.duracion}, ${h.convivencia}, ${h.notas}, ${h.disponibilidad},
         ${h.verificacion}, ${h.createdAt}::timestamptz, ${h.updatedAt}::timestamptz)
      RETURNING *
    `) as HogarRow[];
    return rowToHogar(rows[0]);
  }

  async updateHogar(id: string, patch: HogarPatch): Promise<Hogar | null> {
    const sql = await this.client();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    // Cada push() devuelve el nuevo length, que coincide con el índice $N.
    // Columnas hardcoded (sin inyección); valores siempre parametrizados.
    if (patch.zona !== undefined) {
      setClauses.push(`zona = $${values.push(emptyToNull(patch.zona))}`);
    }
    if (patch.capacidad !== undefined) {
      setClauses.push(`capacidad = $${values.push(patch.capacidad)}`);
    }
    if (patch.acepta !== undefined) {
      setClauses.push(
        `acepta = $${values.push(JSON.stringify(patch.acepta))}::jsonb`,
      );
    }
    if (patch.ofrece !== undefined) {
      setClauses.push(
        `ofrece = $${values.push(JSON.stringify(patch.ofrece))}::jsonb`,
      );
    }
    if (patch.duracion !== undefined) {
      setClauses.push(`duracion = $${values.push(patch.duracion)}`);
    }
    if (patch.convivencia !== undefined) {
      setClauses.push(`convivencia = $${values.push(patch.convivencia)}`);
    }
    if (patch.notas !== undefined) {
      setClauses.push(`notas = $${values.push(emptyToNull(patch.notas))}`);
    }
    if (patch.disponibilidad !== undefined) {
      setClauses.push(`disponibilidad = $${values.push(patch.disponibilidad)}`);
    }
    if (patch.verificacion !== undefined) {
      setClauses.push(`verificacion = $${values.push(patch.verificacion)}`);
    }

    // Patch vacío: estado actual sin tocar updated_at.
    if (setClauses.length === 0) return this.getHogarById(id);

    values.push(id);
    const idIdx = values.length;

    const rows = (await sql(
      `UPDATE hogares SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $${idIdx} RETURNING *`,
      values,
    )) as HogarRow[];
    return rows.length > 0 ? rowToHogar(rows[0]) : null;
  }

  async removeHogar(id: string): Promise<boolean> {
    const sql = await this.client();
    const rows = (await sql`
      DELETE FROM hogares WHERE id = ${id} RETURNING id
    `) as { id: string }[];
    return rows.length > 0;
  }

  async listSolicitudes(): Promise<SolicitudHogar[]> {
    const sql = await this.client();
    const rows = (await sql`
      SELECT * FROM solicitudes_hogar ORDER BY created_at DESC
    `) as SolicitudRow[];
    return rows.map(rowToSolicitud);
  }

  async createSolicitud(
    input: ValidatedSolicitudInput,
  ): Promise<SolicitudHogar> {
    const sql = await this.client();
    const s = buildSolicitud(input);
    const rows = (await sql`
      INSERT INTO solicitudes_hogar
        (id, nombre, telefono, email, ciudad, personas, composicion,
         preferencias, hogar_interes_id, notas, estado, hogar_id,
         codigo_verificacion, hospedada_at, seguimientos, created_at,
         updated_at)
      VALUES
        (${s.id}, ${s.nombre}, ${s.telefono}, ${s.email}, ${s.ciudad},
         ${s.personas},
         ${JSON.stringify(s.composicion)}::jsonb,
         ${JSON.stringify(s.preferencias)}::jsonb,
         ${s.hogarInteresId},
         ${s.notas}, ${s.estado}, ${s.hogarId}, ${s.codigoVerificacion},
         ${s.hospedadaAt}::timestamptz,
         ${JSON.stringify(s.seguimientos)}::jsonb,
         ${s.createdAt}::timestamptz, ${s.updatedAt}::timestamptz)
      RETURNING *
    `) as SolicitudRow[];
    return rowToSolicitud(rows[0]);
  }

  async updateSolicitud(
    id: string,
    patch: SolicitudPatchServidor,
  ): Promise<SolicitudHogar | null> {
    const sql = await this.client();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (patch.estado !== undefined) {
      setClauses.push(`estado = $${values.push(patch.estado)}`);
    }
    if (patch.hogarId !== undefined) {
      setClauses.push(`hogar_id = $${values.push(patch.hogarId)}`);
    }
    if (patch.codigoVerificacion !== undefined) {
      setClauses.push(
        `codigo_verificacion = $${values.push(patch.codigoVerificacion)}`,
      );
    }
    if (patch.notas !== undefined) {
      setClauses.push(`notas = $${values.push(emptyToNull(patch.notas))}`);
    }
    if (patch.hospedadaAt !== undefined) {
      // COALESCE = "sellar una sola vez" resuelto en la propia base: si la
      // fila ya tiene fecha de llegada se conserva, sin leer-antes-de-escribir
      // (y por tanto sin carreras entre dos PATCH simultáneos).
      setClauses.push(
        `hospedada_at = COALESCE(hospedada_at, $${values.push(patch.hospedadaAt)}::timestamptz)`,
      );
    }
    if (patch.seguimientos !== undefined) {
      setClauses.push(
        `seguimientos = $${values.push(JSON.stringify(patch.seguimientos))}::jsonb`,
      );
    }

    if (setClauses.length === 0) {
      const rows = (await sql`
        SELECT * FROM solicitudes_hogar WHERE id = ${id} LIMIT 1
      `) as SolicitudRow[];
      return rows.length > 0 ? rowToSolicitud(rows[0]) : null;
    }

    values.push(id);
    const idIdx = values.length;

    const rows = (await sql(
      `UPDATE solicitudes_hogar SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $${idIdx} RETURNING *`,
      values,
    )) as SolicitudRow[];
    return rows.length > 0 ? rowToSolicitud(rows[0]) : null;
  }
}

// ---------------------------------------------------------------------------
// Fábrica singleton con init perezoso (mismo patrón que lib/db/index.ts)
// ---------------------------------------------------------------------------

let repo: HogaresRepository | null = null;

/** Promesa memorizada: múltiples llamadas concurrentes no relanzan init(). */
let initPromise: Promise<void> | null = null;

/**
 * Devuelve (y crea si es necesario) el repositorio singleton de Hogares.
 * El primer llamado a cualquier método espera a que init() termine.
 */
export function getHogaresRepository(): HogaresRepository {
  if (!repo) {
    const usePostgres =
      process.env.DATABASE_URL !== undefined ||
      process.env.POSTGRES_URL !== undefined;
    repo = usePostgres ? new HogaresPostgresStore() : new HogaresJsonStore();
  }

  // Proxy que garantiza init() exactamente una vez antes de cualquier operación.
  return new Proxy(repo, {
    get(target, prop) {
      const value = target[prop as keyof HogaresRepository];
      if (typeof value !== "function" || prop === "init") {
        return typeof value === "function" ? value.bind(target) : value;
      }
      return async (...args: unknown[]) => {
        if (!initPromise) {
          initPromise = target.init();
        }
        await initPromise;
        return (
          target[prop as keyof HogaresRepository] as (
            ...a: unknown[]
          ) => unknown
        ).apply(target, args);
      };
    },
  });
}
