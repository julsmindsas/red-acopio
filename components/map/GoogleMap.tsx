'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { MapViewProps, VerificationStatus } from '@/lib/types';
import { MEDELLIN_CENTER, DEFAULT_ZOOM } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Tipos mínimos de Google Maps
// @types/google.maps no está instalado en el proyecto; declaramos solo lo que
// usamos para mantener el archivo type-safe sin depender de un paquete ausente.
// ---------------------------------------------------------------------------
interface GMLatLng { lat: number; lng: number }

interface GMMarkerOptions {
  position: GMLatLng;
  map: GMMap;
  title?: string;
  icon?: {
    path: number;
    scale: number;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
  };
}

interface GMMarker {
  setMap(map: GMMap | null): void;
  addListener(event: string, fn: () => void): void;
  getPosition(): GMLatLng;
}

interface GMInfoWindowOptions { content?: string | HTMLElement }
interface GMInfoWindow {
  setContent(content: string | HTMLElement): void;
  open(map: GMMap, anchor?: GMMarker): void;
  close(): void;
}

interface GMMapOptions {
  center: GMLatLng;
  zoom: number;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  streetViewControl?: boolean;
  mapTypeControl?: boolean;
  fullscreenControl?: boolean;
}

interface GMMap {
  panTo(position: GMLatLng): void;
}

interface GMSymbolPath { CIRCLE: number }

interface GoogleMapsNS {
  Map: new (element: HTMLElement, opts: GMMapOptions) => GMMap;
  Marker: new (opts: GMMarkerOptions) => GMMarker;
  InfoWindow: new (opts?: GMInfoWindowOptions) => GMInfoWindow;
  SymbolPath: GMSymbolPath;
}

// Acceso al global inyectado por el SDK de Google Maps en runtime
declare const google: { maps: GoogleMapsNS };

// ---------------------------------------------------------------------------
// Colores de marcador coherentes con STATUS_META (lib/constants.ts)
// ---------------------------------------------------------------------------
const STATUS_FILL: Record<VerificationStatus, string> = {
  verificado:    '#10b981', // esmeralda
  sin_verificar: '#f59e0b', // ámbar
  reportado:     '#0ea5e9', // cielo
};

/**
 * Construye el contenido del InfoWindow como nodo del DOM.
 *
 * SEGURIDAD: el título proviene de datos enviados por la ciudadanía (reportes),
 * por lo que NO debe interpolarse en una cadena HTML (riesgo de XSS almacenado).
 * Usamos `textContent`, que escapa el texto de forma segura.
 */
function buildInfoContent(title: string): HTMLElement {
  const el = document.createElement('strong');
  el.textContent = title;
  return el;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Mapa de Google Maps.
 *
 * Cargado solo en cliente (sin SSR) a través de next/dynamic desde MapView.
 * Usa @googlemaps/js-api-loader para inyectar el SDK de forma asíncrona.
 * Si no hay API key, muestra un mensaje de error en lugar del mapa.
 */
export default function GoogleMap({
  markers,
  userLocation,
  selectedId,
  onSelect,
  center = MEDELLIN_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
}: MapViewProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<GMMap | null>(null);
  const markersRef     = useRef<Record<string, GMMarker>>({});
  const userMarkerRef  = useRef<GMMarker | null>(null);
  const infoWindowRef  = useRef<GMInfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  // Inicializa el mapa una vez (o cuando cambia la key)
  useEffect(() => {
    if (!apiKey) {
      setError('No hay API key de Google Maps configurada.');
      return;
    }
    if (!containerRef.current) return;

    let mounted = true;
    const loader = new Loader({ apiKey, version: 'weekly' });

    loader.load().then(() => {
      if (!mounted || !containerRef.current) return;

      const gmap = new google.maps.Map(containerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      mapRef.current        = gmap;
      infoWindowRef.current = new google.maps.InfoWindow();
      setMapReady(true);
    }).catch(() => {
      if (mounted) setError('No se pudo cargar Google Maps. Verifica la API key.');
    });

    return () => {
      mounted = false;
      // Limpia todos los marcadores al desmontar
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      mapRef.current = null;
    };
    // El mapa solo se inicializa una vez; cambios de markers/selectedId se manejan abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Sincroniza marcadores cuando el mapa está listo o cambian los datos
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const gmap = mapRef.current;

    // Elimina marcadores anteriores (centros + usuario)
    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = null;

    // Crea marcadores de centros de acopio
    markers.forEach((m) => {
      const gm = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: gmap,
        title: m.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: STATUS_FILL[m.status],
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      gm.addListener('click', () => {
        onSelect?.(m.id);
        infoWindowRef.current?.setContent(buildInfoContent(m.title));
        infoWindowRef.current?.open(gmap, gm);
      });

      markersRef.current[m.id] = gm;
    });

    // Marcador de ubicación del usuario (guardado en ref para limpieza)
    if (userLocation) {
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: gmap,
        title: 'Tu ubicación',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
    }
  }, [mapReady, markers, userLocation, onSelect]);

  // Abre el InfoWindow del marcador seleccionado y centra el mapa en él
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedId) return;
    const gm = markersRef.current[selectedId];
    if (!gm) return;
    const found = markers.find((m) => m.id === selectedId);
    if (!found) return;
    mapRef.current.panTo({ lat: found.lat, lng: found.lng });
    infoWindowRef.current?.setContent(buildInfoContent(found.title));
    infoWindowRef.current?.open(mapRef.current, gm);
  }, [mapReady, selectedId, markers]);

  // Acomoda el mapa a la ubicación del usuario cuando se obtiene.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation) return;
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
  }, [mapReady, userLocation]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className ?? ''}`}
        style={{ height: '100%', width: '100%' }}
      >
        <p className="px-4 text-center text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: '100%', width: '100%' }}
    />
  );
}
