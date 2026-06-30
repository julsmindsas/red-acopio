'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MapProviderName } from '@/lib/types';

/** Número de errores de tile de OSM que activan el cambio automático a Google Maps. */
const TILE_ERROR_THRESHOLD = 3;

export interface UseMapProviderResult {
  /** Proveedor de mapa activo en este momento. */
  provider: MapProviderName;
  /**
   * Notifica un fallo de tile OSM.
   * Tras TILE_ERROR_THRESHOLD fallos (y si hay key de Google) cambia de proveedor.
   */
  reportTileError: () => void;
  /**
   * Cambia inmediatamente a Google Maps (lo usa el timeout de 8 s sin tiles).
   * No hace nada si forceProvider está activo o no hay key de Google.
   */
  switchToGoogle: () => void;
  /** true si existe NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el entorno. */
  googleAvailable: boolean;
}

/**
 * Hook que decide qué proveedor de mapa usar.
 *
 * Empieza con Leaflet. Después de TILE_ERROR_THRESHOLD errores de tile,
 * o si se llama a switchToGoogle(), cambia a Google Maps (solo si googleAvailable).
 * Si llega forceProvider, ese valor prevalece sobre la lógica interna.
 */
export function useMapProvider(
  forceProvider?: MapProviderName,
  onProviderChange?: (provider: MapProviderName) => void,
): UseMapProviderResult {
  const googleAvailable = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const initialProvider: MapProviderName = forceProvider ?? 'leaflet';
  const [provider, setProvider] = useState<MapProviderName>(initialProvider);

  // Usamos ref para el contador de errores y evitar problemas con batching de React
  const tileErrorCount = useRef(0);

  // Ref estable para onProviderChange (evita dependencias inestables en efectos)
  const onProviderChangeRef = useRef(onProviderChange);
  useEffect(() => {
    onProviderChangeRef.current = onProviderChange;
  }, [onProviderChange]);

  // Respeta forceProvider cuando llega o cambia desde el padre
  useEffect(() => {
    if (forceProvider) {
      setProvider(forceProvider);
      tileErrorCount.current = 0;
    }
  }, [forceProvider]);

  // Notifica al padre solo cuando el proveedor cambia (no en el mount inicial)
  const prevProviderRef = useRef<MapProviderName>(initialProvider);
  useEffect(() => {
    if (prevProviderRef.current !== provider) {
      prevProviderRef.current = provider;
      onProviderChangeRef.current?.(provider);
    }
  }, [provider]);

  const reportTileError = useCallback(() => {
    if (forceProvider || !googleAvailable) return;
    tileErrorCount.current += 1;
    if (tileErrorCount.current >= TILE_ERROR_THRESHOLD) {
      setProvider('google');
    }
  }, [forceProvider, googleAvailable]);

  const switchToGoogle = useCallback(() => {
    if (forceProvider || !googleAvailable) return;
    setProvider('google');
  }, [forceProvider, googleAvailable]);

  return { provider, reportTileError, switchToGoogle, googleAvailable };
}
