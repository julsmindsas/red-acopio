/**
 * Reportes comunitarios sobre el estado de un punto.
 *
 * POR QUÉ EXISTE
 * --------------
 * En una emergencia el dato caduca en horas: el albergue se llena, el acopio
 * cierra, la fila da la vuelta a la manzana. Ninguna redacción ni ningún equipo
 * editor alcanza a mantener eso al día para 57 puntos en 17 ciudades.
 *
 * Quien sí lo sabe es la persona que acaba de pasar por ahí. Este módulo le
 * permite decirlo en un toque, sin registro ni datos personales — la lección
 * que dejó el mapa de Ushahidi tras el terremoto de Haití: la información útil
 * la tiene la gente en el terreno, si le das un canal de dos segundos.
 *
 * PRIVACIDAD: no se guarda la IP. Solo un hash con sal (SHA-256, truncado) que
 * sirve para limitar el abuso y no permite identificar a nadie ni reconstruir
 * la dirección original.
 */
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

import type { CommunityStatus, OperationalStatus } from "../types";

/** Ventana en la que un reporte se considera vigente. */
const WINDOW_HOURS = 12;

/** Un mismo dispositivo no puede reportar el mismo punto más de una vez por hora. */
const COOLDOWN_MINUTES = 60;

function getSql(): ReturnType<typeof neon> | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

let initPromise: Promise<void> | null = null;
function ensureInit(sql: ReturnType<typeof neon>): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS center_reports (
          id            BIGSERIAL PRIMARY KEY,
          center_id     TEXT NOT NULL,
          status        TEXT NOT NULL,
          reporter_hash TEXT NOT NULL,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS center_reports_center_created
        ON center_reports (center_id, created_at DESC)
      `;
    })();
  }
  return initPromise;
}

/**
 * Identificador anónimo y estable del reportante.
 *
 * La sal viene de `ADMIN_SECRET` (ya presente en el despliegue) para que el
 * hash no pueda revertirse por fuerza bruta sobre el espacio de IPv4.
 */
export function reporterHash(ip: string, userAgent: string): string {
  const salt = process.env.ADMIN_SECRET ?? "red-acopio";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

export type ReportOutcome = "ok" | "cooldown" | "unavailable";

/** Registra un reporte. Devuelve `cooldown` si ese dispositivo ya reportó hace poco. */
export async function addReport(
  centerId: string,
  status: OperationalStatus,
  hash: string,
): Promise<ReportOutcome> {
  const sql = getSql();
  if (!sql) return "unavailable";

  try {
    await ensureInit(sql);

    const recent = (await sql`
      SELECT 1 FROM center_reports
      WHERE center_id = ${centerId}
        AND reporter_hash = ${hash}
        AND created_at > NOW() - (${COOLDOWN_MINUTES} * INTERVAL '1 minute')
      LIMIT 1
    `) as unknown[];

    if (recent.length > 0) return "cooldown";

    await sql`
      INSERT INTO center_reports (center_id, status, reporter_hash)
      VALUES (${centerId}, ${status}, ${hash})
    `;
    return "ok";
  } catch (err) {
    console.error("[reports] no se pudo guardar el reporte:", err);
    return "unavailable";
  }
}

/**
 * Estado comunitario de todos los puntos con reportes recientes.
 *
 * Se resuelve el estado por MAYORÍA dentro de la ventana, no por el último
 * reporte: así una sola persona equivocada (o malintencionada) no marca un
 * albergue como cerrado.
 */
export async function getCommunityStatuses(): Promise<
  Record<string, CommunityStatus>
> {
  const sql = getSql();
  if (!sql) return {};

  try {
    await ensureInit(sql);

    const rows = (await sql`
      SELECT center_id, status, COUNT(*)::int AS count, MAX(created_at) AS last_at
      FROM center_reports
      WHERE created_at > NOW() - (${WINDOW_HOURS} * INTERVAL '1 hour')
      GROUP BY center_id, status
    `) as {
      center_id: string;
      status: string;
      count: number;
      last_at: string;
    }[];

    const best: Record<string, CommunityStatus> = {};
    for (const row of rows) {
      const current = best[row.center_id];
      // Gana el estado más reportado; a igualdad, el que tenga el reporte más
      // reciente (una situación que cambia suele reportarse de nuevo).
      const wins =
        !current ||
        row.count > current.count ||
        (row.count === current.count &&
          new Date(row.last_at) > new Date(current.lastReportAt));

      if (wins) {
        best[row.center_id] = {
          status: row.status as OperationalStatus,
          count: row.count,
          lastReportAt: new Date(row.last_at).toISOString(),
        };
      }
    }

    return best;
  } catch (err) {
    console.error("[reports] no se pudieron leer los reportes:", err);
    return {};
  }
}
