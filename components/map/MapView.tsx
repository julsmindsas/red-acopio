'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapViewProps } from '@/lib/types';
import { MEDELLIN_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import { useMapProvider } from './useMapProvider';

// ---------------------------------------------------------------------------
// Carga diferida (solo cliente) de las implementaciones de mapa.
// Leaflet y Google Maps usan `window`; importarlos con ssr:false evita errores
// de hidratación y referencias a globals inexistentes en el servidor.
// ---------------------------------------------------------------------------
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const GoogleMapComponent = dynamic(() => import('./GoogleMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/** Placeholder animado mientras carga el proveedor de mapa. */
function MapSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-100">
      <span className="text-sm text-gray-400">Cargando mapa…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente público
// ---------------------------------------------------------------------------

/**
 * Componente de mapa de alto nivel para Red de Acopio.
 *
 * ## Comportamiento de proveedores
 * - Renderiza Leaflet + OpenStreetMap por defecto.
 * - **Fallback automático a Google Maps** si se da alguna de estas condiciones
 *   y existe `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:
 *   1. Se acumulan ≥ 3 errores de tile (`tileerror` en TileLayer de OSM).
 *   2. Transcurren ~8 s sin que cargue ningún tile.
 * - Si **no** hay API key de Google y hay problemas de tiles, mantiene Leaflet
 *   y muestra un aviso suave de conectividad.
 * - Si llega `forceProvider`, ese proveedor tiene prioridad absoluta.
 *
 * ## Altura
 * El mapa usa `h-full`; el contenedor padre debe tener altura definida
 * (p. ej. `h-[60vh]` o `h-screen`).
 */
export default function MapView({
  markers,
  userLocation,
  selectedId,
  onSelect,
  center   = MEDELLIN_CENTER,
  zoom     = DEFAULT_ZOOM,
  className,
  forceProvider,
  onProviderChange,
}: MapViewProps) {
  const { provider, reportTileError, switchToGoogle, googleAvailable } =
    useMapProvider(forceProvider, onProviderChange);

  // Aviso suave de conectividad (solo cuando Leaflet falla sin key de Google)
  const [showConnWarning, setShowConnWarning] = useState(false);

  // Ref para saber si ya cargó al menos un tile en este ciclo de proveedor
  const tilesLoadedRef = useRef(false);

  // Cuando el tile carga bien: cancela el aviso y marca como cargado
  const handleTileLoad = useCallback(() => {
    tilesLoadedRef.current = true;
    setShowConnWarning(false);
  }, []);

  // Cuando el tile falla: reporta al hook y muestra aviso si no hay Google
  const handleTileError = useCallback(() => {
    reportTileError();
    if (!googleAvailable) {
      setShowConnWarning(true);
    }
  }, [reportTileError, googleAvailable]);

  // Timeout de ~8 s: si no cargó ningún tile, intenta el fallback a Google
  // (o muestra aviso si no hay key). Se reinicia cada vez que volvemos a Leaflet.
  useEffect(() => {
    if (provider !== 'leaflet') return;

    tilesLoadedRef.current = false;

    const timer = window.setTimeout(() => {
      if (tilesLoadedRef.current) return; // ya cargó al menos un tile, ok
      if (googleAvailable) {
        switchToGoogle();
      } else {
        setShowConnWarning(true);
      }
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [provider, googleAvailable, switchToGoogle]);

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      {provider === 'leaflet' ? (
        <LeafletMap
          markers={markers}
          userLocation={userLocation}
          selectedId={selectedId}
          onSelect={onSelect}
          center={center}
          zoom={zoom}
          className="h-full w-full"
          onTileError={handleTileError}
          onTileLoad={handleTileLoad}
        />
      ) : (
        <GoogleMapComponent
          markers={markers}
          userLocation={userLocation}
          selectedId={selectedId}
          onSelect={onSelect}
          center={center}
          zoom={zoom}
          className="h-full w-full"
        />
      )}

      {/* Aviso suave: solo aparece con Leaflet cuando hay problemas de conexión */}
      {showConnWarning && provider === 'leaflet' && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-xs text-white">
          Problemas de conexión con el mapa
        </div>
      )}
    </div>
  );
}
