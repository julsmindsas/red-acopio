/**
 * Fábrica del repositorio de centros de acopio.
 *
 * Selecciona la implementación adecuada según las variables de entorno:
 *   - Si existe DATABASE_URL o POSTGRES_URL → PostgresStore (producción / Neon).
 *   - Si no → JsonStore (desarrollo local, sin configuración).
 *
 * La inicialización es "perezosa" e idempotente: el primer llamado a
 * cualquier método del repositorio espera a que init() termine; los
 * siguientes reúsan la promesa ya resuelta.
 */
import type { CenterRepository } from "./repository";

// NOTA: no re-exportamos JsonStore/PostgresStore aquí a propósito. Hacerlo
// forzaría a que ambas implementaciones (incluida la basada en `fs` del
// JsonStore) se incluyan estáticamente en el bundle de las rutas API, lo que
// dispara un trazado innecesario de archivos en producción. Los scripts que
// necesiten una implementación concreta deben importarla directamente, p. ej.:
//   import { PostgresStore } from "@/lib/db/postgresStore";

/** Instancia singleton del repositorio activo. */
let repo: CenterRepository | null = null;

/**
 * Promesa que se resuelve cuando init() completa.
 * Se memoriza para que múltiples llamadas concurrentes no relancen init().
 */
let initPromise: Promise<void> | null = null;

/**
 * Devuelve (y crea si es necesario) el repositorio singleton.
 *
 * La lógica de selección es:
 *   DATABASE_URL o POSTGRES_URL presentes → PostgresStore
 *   de lo contrario                       → JsonStore
 */
export function getRepository(): CenterRepository {
  if (!repo) {
    const usePostgres =
      process.env.DATABASE_URL !== undefined ||
      process.env.POSTGRES_URL !== undefined;

    if (usePostgres) {
      const { PostgresStore } = require("./postgresStore") as typeof import("./postgresStore");
      repo = new PostgresStore();
    } else {
      const { JsonStore } = require("./jsonStore") as typeof import("./jsonStore");
      repo = new JsonStore();
    }
  }

  // Envolvemos el repositorio para garantizar que init() se llame exactamente
  // una vez antes de cualquier operación.
  return new Proxy(repo, {
    get(target, prop) {
      const value = target[prop as keyof CenterRepository];
      if (typeof value !== "function" || prop === "init") {
        return typeof value === "function" ? value.bind(target) : value;
      }

      // Para list, getById y create: nos aseguramos de que init() ya corrió.
      return async (...args: unknown[]) => {
        if (!initPromise) {
          initPromise = target.init();
        }
        await initPromise;
        return (target[prop as keyof CenterRepository] as Function).apply(target, args);
      };
    },
  });
}
