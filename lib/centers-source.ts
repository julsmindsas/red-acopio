/**
 * Fuente unificada de centros para la vista pública (estrategia híbrida).
 *
 * Combina:
 *   1. Los centros oficiales de acopiove.org (Colombia, verificados, read-only).
 *   2. Nuestros centros locales (aportes curados + reportes ciudadanos).
 *
 * Deduplica: si un centro local está muy cerca (≈150 m) de uno oficial, se
 * asume que son el mismo punto y se conserva el oficial (autoritativo). Así no
 * mostramos "Grupo Mega Itagüí" (nuestro) y "Sociedad Civil — Mall Itagüí"
 * (oficial) como dos pines. Nuestros centros únicos (sin equivalente oficial
 * cercano) se conservan.
 */
import type { Center } from "./types";
import { haversineKm } from "./geo";
import { getRepository } from "./db";
import { fetchOfficialCenters } from "./acopio-api";

/** Radio (km) bajo el cual un centro local se considera duplicado de uno oficial. */
const DEDUP_RADIUS_KM = 0.15; // 150 m

/**
 * Devuelve la lista combinada de centros (oficiales + locales no duplicados).
 * Tolera fallos parciales: si una fuente falla, usa la otra.
 */
export async function listAllCenters(): Promise<Center[]> {
  const [official, local] = await Promise.all([
    fetchOfficialCenters().catch(() => [] as Center[]),
    getRepository()
      .list()
      .catch(() => [] as Center[]),
  ]);

  // Conserva los locales que NO tengan un oficial muy cercano.
  const localUnique = local.filter(
    (l) =>
      !official.some(
        (o) => haversineKm({ lat: l.lat, lng: l.lng }, { lat: o.lat, lng: o.lng }) <= DEDUP_RADIUS_KM,
      ),
  );

  return [...official, ...localUnique];
}

/** Solo los centros locales (para el panel admin, que únicamente edita los nuestros). */
export async function listLocalCenters(): Promise<Center[]> {
  return getRepository()
    .list()
    .catch(() => [] as Center[]);
}
