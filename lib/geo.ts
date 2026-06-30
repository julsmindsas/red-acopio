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
): CenterWithDistance[] {
  if (!from) {
    return centers.map((c) => ({ ...c, distanceKm: null }));
  }

  return centers
    .map((c) => ({
      ...c,
      distanceKm: haversineKm(from, { lat: c.lat, lng: c.lng }),
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

/** Formatea una distancia en km a un texto amigable ("350 m", "1,2 km"). */
export function formatDistance(km: number | null): string {
  if (km === null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
