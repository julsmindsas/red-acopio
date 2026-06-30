/**
 * Contrato de acceso a datos (patrón Repository).
 *
 * Toda la app habla con la base de datos a través de esta interfaz, nunca
 * directamente. Esto permite cambiar el backend de almacenamiento sin tocar la
 * API ni la UI. Hoy existen dos implementaciones:
 *
 *   - `JsonStore`     -> archivo JSON local (desarrollo, sin configurar nada).
 *   - `PostgresStore` -> Postgres/Neon (producción en Vercel).
 *
 * Para añadir otro backend (Firestore, Supabase, MongoDB...), basta con
 * implementar `CenterRepository` y registrarlo en `lib/db/index.ts`.
 */
import type {
  Center,
  CenterInput,
  CenterPatch,
  VerificationStatus,
} from "../types";

/** Metadatos que el servidor adjunta al crear un centro. */
export interface CreateMeta {
  /** Estado inicial. Por defecto "reportado" (viene del formulario ciudadano). */
  status?: VerificationStatus;
  /** Origen del dato (URL de fuente, "reporte-ciudadano", etc.). */
  source?: string;
}

export interface CenterRepository {
  /** Inicializa el almacenamiento (crea tabla/archivo y siembra si está vacío). */
  init(): Promise<void>;

  /** Devuelve todos los centros conocidos. */
  list(): Promise<Center[]>;

  /** Devuelve un centro por id, o `null` si no existe. */
  getById(id: string): Promise<Center | null>;

  /** Crea un centro a partir de la entrada validada del usuario. */
  create(input: CenterInput, meta?: CreateMeta): Promise<Center>;

  /**
   * Actualiza parcialmente un centro (panel admin). Devuelve el centro
   * actualizado, o `null` si no existe. Refresca `updatedAt`.
   */
  update(id: string, patch: CenterPatch): Promise<Center | null>;

  /** Elimina un centro (panel admin). Devuelve `true` si existía y se borró. */
  remove(id: string): Promise<boolean>;
}
