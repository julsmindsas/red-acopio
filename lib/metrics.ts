/**
 * Métricas de uso propias (sin terceros ni costo).
 *
 * - Registra "visitas" a centros (clic en "Cómo llegar" / "Llamar") en una tabla
 *   propia `center_visits`, para calcular los centros más consultados.
 * - Calcula estadísticas para el panel admin (reportes recibidos por día,
 *   totales, centros más consultados) a partir de Postgres.
 *
 * Requiere Postgres (DATABASE_URL/POSTGRES_URL). Sin base de datos configurada,
 * las funciones degradan con elegancia (no-op / métricas vacías) para no romper
 * el desarrollo local.
 */
import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

/** Cliente Postgres si hay conexión configurada; si no, `null`. */
function getSql(): Sql | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

// Inicialización perezosa e idempotente de la tabla de visitas.
let initPromise: Promise<void> | null = null;
function ensureInit(sql: Sql): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS center_visits (
          center_id   text PRIMARY KEY,
          center_name text NOT NULL,
          visits      integer NOT NULL DEFAULT 0,
          updated_at  timestamptz NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return initPromise;
}

/**
 * Registra una visita/consulta a un centro (incrementa su contador).
 * Fire-and-forget: nunca lanza; si falla, solo loguea.
 */
export async function recordVisit(
  centerId: string,
  centerName: string,
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await ensureInit(sql);
    await sql`
      INSERT INTO center_visits (center_id, center_name, visits, updated_at)
      VALUES (${centerId}, ${centerName}, 1, now())
      ON CONFLICT (center_id) DO UPDATE
        SET visits = center_visits.visits + 1,
            center_name = EXCLUDED.center_name,
            updated_at = now()
    `;
  } catch (err) {
    console.error("[metrics] recordVisit falló:", err);
  }
}

/** Estadísticas para el panel administrativo. */
export interface AdminMetrics {
  totals: {
    centrosLocales: number;
    reportesPendientes: number;
    totalVisitas: number;
  };
  /** Reportes ciudadanos recibidos por día (últimos 14 días). */
  reportesPorDia: { fecha: string; cantidad: number }[];
  /** Centros más consultados (top 10 por visitas). */
  masConsultados: { centerId: string; centerName: string; visitas: number }[];
}

const EMPTY_METRICS: AdminMetrics = {
  totals: { centrosLocales: 0, reportesPendientes: 0, totalVisitas: 0 },
  reportesPorDia: [],
  masConsultados: [],
};

/** Calcula las métricas del panel admin. Devuelve vacías si no hay Postgres. */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const sql = getSql();
  if (!sql) return EMPTY_METRICS;

  try {
    await ensureInit(sql);

    const [totalRow] = (await sql`SELECT count(*)::int AS n FROM centers`) as {
      n: number;
    }[];
    const [pendRow] = (await sql`
      SELECT count(*)::int AS n FROM centers WHERE status = 'reportado'
    `) as { n: number }[];
    const [visitRow] = (await sql`
      SELECT COALESCE(sum(visits), 0)::int AS n FROM center_visits
    `) as { n: number }[];

    const porDia = (await sql`
      SELECT to_char(created_at::date, 'YYYY-MM-DD') AS fecha,
             count(*)::int AS cantidad
      FROM centers
      WHERE status = 'reportado'
        AND created_at >= now() - interval '14 days'
      GROUP BY 1
      ORDER BY 1
    `) as { fecha: string; cantidad: number }[];

    const top = (await sql`
      SELECT center_id, center_name, visits
      FROM center_visits
      ORDER BY visits DESC
      LIMIT 10
    `) as { center_id: string; center_name: string; visits: number }[];

    return {
      totals: {
        centrosLocales: totalRow?.n ?? 0,
        reportesPendientes: pendRow?.n ?? 0,
        totalVisitas: visitRow?.n ?? 0,
      },
      reportesPorDia: porDia,
      masConsultados: top.map((r) => ({
        centerId: r.center_id,
        centerName: r.center_name,
        visitas: r.visits,
      })),
    };
  } catch (err) {
    console.error("[metrics] getAdminMetrics falló:", err);
    return EMPTY_METRICS;
  }
}
