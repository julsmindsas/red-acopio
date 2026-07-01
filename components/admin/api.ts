/**
 * Cliente de la API administrativa (lado del navegador).
 * --------------------------------------------------------------------------
 * Centraliza todas las llamadas `fetch` del panel para que los componentes no
 * repitan cabeceras, manejo de errores ni el `credentials: "same-origin"` que
 * acompaña a la cookie httpOnly de sesión.
 *
 * Todas las funciones devuelven un `Result<T>` discriminado en lugar de lanzar:
 * así la UI decide qué hacer ante 401 (sesión perdida), 400 (errores por campo)
 * o un fallo de red, sin envolver cada llamada en try/catch.
 */
import type { Center, CenterPatch } from "@/lib/types";

/** Estado de la sesión administrativa que reporta el servidor. */
export interface SessionState {
  /** `true` si el panel está configurado (existe ADMIN_PASSWORD en el servidor). */
  configured: boolean;
  /** `true` si la cookie de sesión es válida. */
  authenticated: boolean;
}

/**
 * Métricas de uso del panel administrativo.
 * Coincide con el shape que devuelve GET /api/admin/metrics.
 */
export interface AdminMetrics {
  /** Totales de un vistazo (tarjetas de resumen). */
  totals: {
    /** Centros locales gestionables. */
    centrosLocales: number;
    /** Reportes ciudadanos pendientes de revisión. */
    reportesPendientes: number;
    /** Consultas totales acumuladas ("Cómo llegar" / "Llamar"). */
    totalVisitas: number;
  };
  /**
   * Reportes ciudadanos recibidos por día en los últimos 14 días.
   * Puede venir con huecos: los días sin reportes no aparecen.
   */
  reportesPorDia: { fecha: string; cantidad: number }[];
  /** Centros más consultados (top 10 por visitas). Puede venir vacío. */
  masConsultados: { centerId: string; centerName: string; visitas: number }[];
}

/**
 * Resultado uniforme de una llamada a la API.
 * - `ok: true`  -> `data` con la respuesta tipada.
 * - `ok: false` -> `status` HTTP (0 si fue error de red), `error` legible y,
 *   cuando aplica (400), `fields` con los mensajes de validación por campo.
 */
export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      error: string;
      fields?: Record<string, string[]>;
    };

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/** Opciones comunes: enviar la cookie de sesión y no cachear respuestas. */
const COMMON: RequestInit = { credentials: "same-origin", cache: "no-store" };

/** Resultado reutilizable para fallos de red (sin respuesta del servidor). */
const NET_ERROR = {
  ok: false as const,
  status: 0,
  error: "Problema de conexión. Revisa tu internet e inténtalo de nuevo.",
};

/** Intenta extraer `{ error, fields }` del cuerpo JSON de una respuesta de error. */
async function readError(
  res: Response,
  fallback: string,
): Promise<{ error: string; fields?: Record<string, string[]> }> {
  try {
    const body = (await res.json()) as {
      error?: string;
      fields?: Record<string, string[]>;
    };
    return {
      error: body?.error ?? fallback,
      fields: body?.fields,
    };
  } catch {
    return { error: fallback };
  }
}

/** GET /api/admin/session — estado de configuración y autenticación. */
export async function fetchSession(): Promise<Result<SessionState>> {
  try {
    const res = await fetch("/api/admin/session", COMMON);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: "No se pudo verificar el estado de la sesión.",
      };
    }
    return { ok: true, data: (await res.json()) as SessionState };
  } catch {
    return NET_ERROR;
  }
}

/** POST /api/admin/login — inicia sesión con la contraseña del panel. */
export async function login(password: string): Promise<Result<true>> {
  try {
    const res = await fetch("/api/admin/login", {
      ...COMMON,
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ password }),
    });
    if (res.ok) return { ok: true, data: true };
    const { error } = await readError(res, "No se pudo iniciar sesión.");
    return { ok: false, status: res.status, error };
  } catch {
    return NET_ERROR;
  }
}

/** POST /api/admin/logout — cierra la sesión (borra la cookie). */
export async function logout(): Promise<Result<true>> {
  try {
    const res = await fetch("/api/admin/logout", {
      ...COMMON,
      method: "POST",
    });
    if (res.ok) return { ok: true, data: true };
    const { error } = await readError(res, "No se pudo cerrar la sesión.");
    return { ok: false, status: res.status, error };
  } catch {
    return NET_ERROR;
  }
}

/** GET /api/admin/centers — lista de centros locales gestionables. */
export async function getCenters(): Promise<Result<Center[]>> {
  try {
    const res = await fetch("/api/admin/centers", COMMON);
    if (res.ok) return { ok: true, data: (await res.json()) as Center[] };
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 401
          ? "Tu sesión expiró. Vuelve a iniciar sesión."
          : "No se pudieron cargar los centros.",
    };
  } catch {
    return NET_ERROR;
  }
}

/** GET /api/admin/metrics — métricas de uso (totales, reportes por día, top). */
export async function getMetrics(): Promise<Result<AdminMetrics>> {
  try {
    const res = await fetch("/api/admin/metrics", COMMON);
    if (res.ok) return { ok: true, data: (await res.json()) as AdminMetrics };
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 401
          ? "Tu sesión expiró. Vuelve a iniciar sesión."
          : "No se pudieron cargar las métricas.",
    };
  } catch {
    return NET_ERROR;
  }
}

/** PATCH /api/admin/centers/{id} — actualiza campos parciales de un centro. */
export async function patchCenter(
  id: string,
  patch: CenterPatch,
): Promise<Result<Center>> {
  try {
    const res = await fetch(`/api/admin/centers/${encodeURIComponent(id)}`, {
      ...COMMON,
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    });
    if (res.ok) return { ok: true, data: (await res.json()) as Center };
    const fallback =
      res.status === 404
        ? "El centro ya no existe; quizás se eliminó."
        : "No se pudieron guardar los cambios.";
    const { error, fields } = await readError(res, fallback);
    return { ok: false, status: res.status, error, fields };
  } catch {
    return NET_ERROR;
  }
}

/** DELETE /api/admin/centers/{id} — elimina un centro local. */
export async function deleteCenter(id: string): Promise<Result<true>> {
  try {
    const res = await fetch(`/api/admin/centers/${encodeURIComponent(id)}`, {
      ...COMMON,
      method: "DELETE",
    });
    if (res.ok) return { ok: true, data: true };
    const fallback =
      res.status === 404
        ? "El centro ya no existe."
        : "No se pudo eliminar el centro.";
    const { error } = await readError(res, fallback);
    return { ok: false, status: res.status, error };
  } catch {
    return NET_ERROR;
  }
}
