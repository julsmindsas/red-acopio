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

  // Copia editable de los oficiales para poder enriquecerlos.
  const officialEnriched = official.map((o) => ({
    ...o,
    materials: [...o.materials],
  }));

  // Para cada centro local: si coincide con un oficial cercano (mismo punto),
  // NO lo descartamos del todo — fusionamos sus materiales en el oficial (unión).
  // Así no perdemos nuestro conocimiento local (p. ej. que también recibe para
  // mascotas) y evitamos pines duplicados. Los locales sin equivalente oficial
  // se conservan tal cual.
  const localUnique: Center[] = [];
  for (const l of local) {
    const match = officialEnriched.find(
      (o) =>
        haversineKm({ lat: l.lat, lng: l.lng }, { lat: o.lat, lng: o.lng }) <=
        DEDUP_RADIUS_KM,
    );
    if (match) {
      for (const m of l.materials) {
        if (!match.materials.includes(m)) match.materials.push(m);
      }
    } else {
      localUnique.push(l);
    }
  }

  return [...officialEnriched, ...localUnique];
}

/** Solo los centros locales (para el panel admin, que únicamente edita los nuestros). */
export async function listLocalCenters(): Promise<Center[]> {
  return getRepository()
    .list()
    .catch(() => [] as Center[]);
}
