/**
 * Utilidades geográficas: cálculo de distancias y ordenamiento por cercanía.
 */
import type { Center, CenterWithDistance, LatLng } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distancia en kilómetros entre dos puntos usando la fórmula de Haversine.
 * Precisa a escala de ciudad (asume Tierra esférica).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Enriquece una lista de centros con su distancia al usuario y la ordena de
 * más cercano a más lejano. Si `from` es `null` (sin geolocalización), conserva
 * el orden original y deja `distanceKm` en `null`.
 */
export function withDistance(
  centers: Center[],
  from: LatLng | null,
  /**
   * Origen alternativo para ORDENAR cuando no hay ubicación del usuario
   * (normalmente, el centro de la ciudad elegida en el mapa).
   *
   * Ordenar por él evita que quien está viendo Pereira reciba primero los
   * puntos de Manizales. La distancia sigue en `null`: solo se muestra un
   * "a X km" cuando de verdad se mide desde donde está la persona.
   */
  fallbackOrigin?: LatLng | null,
): CenterWithDistance[] {
  if (!from) {
    const withNullDistance = centers.map((c) => ({ ...c, distanceKm: null }));
    if (!fallbackOrigin) return withNullDistance;

    return withNullDistance.sort(
      (a, b) =>
        haversineKm(fallbackOrigin, { lat: a.lat, lng: a.lng }) -
        haversineKm(fallbackOrigin, { lat: b.lat, lng: b.lng }),
    );
  }

  return centers
    .map((c) => ({
      ...c,
      distanceKm: haversineKm(from, { lat: c.lat, lng: c.lng }),
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

/**
 * Devuelve el elemento del catálogo cuyo `center` está más cerca de `from`.
 *
 * Se usa para decidir en qué ciudad abrir el mapa: quien lo abre en Pereira no
 * debería aterrizar en Manizales. Si `from` es `null` no hay nada que comparar
 * y se devuelve `null` para que el llamador aplique su propio valor por defecto.
 */
export function nearestPlace<T extends { center: LatLng }>(
  places: readonly T[],
  from: LatLng | null,
): T | null {
  if (!from || places.length === 0) return null;

  let best = places[0];
  let bestKm = haversineKm(from, best.center);
  for (const place of places.slice(1)) {
    const km = haversineKm(from, place.center);
    if (km < bestKm) {
      best = place;
      bestKm = km;
    }
  }
  return best;
}

/** Formatea una distancia en km a un texto amigable ("350 m", "1,2 km"). */
export function formatDistance(km: number | null): string {
  if (km === null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
