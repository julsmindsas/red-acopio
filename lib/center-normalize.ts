/**
 * Normalización de centros leídos de cualquier origen (JSON local, Postgres,
 * API externa, scraper).
 *
 * Los campos `kind` y `operational` se añadieron con la emergencia del sismo de
 * Colombia (10-ago-2026); los registros creados antes no los traen. En vez de
 * hacerlos opcionales en el tipo (lo que obligaría a comprobar `?? "acopio"` en
 * cada componente), se rellenan aquí una sola vez, en la frontera de lectura.
 */
import {
  OPERATIONAL_STATUSES,
  POINT_KINDS,
  type Center,
  type OperationalStatus,
  type PointKind,
} from "./types";

/** `true` si el valor es un tipo de punto conocido. */
export function isPointKind(value: unknown): value is PointKind {
  return POINT_KINDS.includes(value as PointKind);
}

/** `true` si el valor es un estado operativo conocido. */
export function isOperationalStatus(value: unknown): value is OperationalStatus {
  return OPERATIONAL_STATUSES.includes(value as OperationalStatus);
}

/** Tipo de punto con respaldo a `"acopio"` (el comportamiento histórico). */
export function toPointKind(value: unknown): PointKind {
  return isPointKind(value) ? value : "acopio";
}

/** Estado operativo con respaldo a `"desconocido"` (no afirmamos lo que no sabemos). */
export function toOperationalStatus(value: unknown): OperationalStatus {
  return isOperationalStatus(value) ? value : "desconocido";
}

/**
 * Completa los campos que pudieran faltar en un registro leído de disco o de la
 * base de datos. No inventa información: los valores por defecto son los más
 * conservadores posibles.
 */
export function normalizeCenter(raw: Center): Center {
  return {
    ...raw,
    kind: toPointKind(raw.kind),
    operational: toOperationalStatus(raw.operational),
    materials: Array.isArray(raw.materials) ? raw.materials : [],
    urgentNeeds: Array.isArray(raw.urgentNeeds) ? raw.urgentNeeds : undefined,
    notReceiving: Array.isArray(raw.notReceiving) ? raw.notReceiving : undefined,
  };
}
