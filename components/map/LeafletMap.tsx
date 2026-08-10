'use client';

// CSS de Leaflet: debe importarse antes de usar cualquier componente de react-leaflet
import 'leaflet/dist/leaflet.css';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type L from 'leaflet';
import type { LatLng, MapViewProps } from '@/lib/types';
import { DEFAULT_CITY, DEFAULT_ZOOM } from '@/lib/constants';
import { createPointIcon, createZoneIcon, USER_ICON } from './icons';

// Extiende MapViewProps con las callbacks de estado de tiles que necesita MapView
interface LeafletMapProps extends MapViewProps {
  /** Se invoca cada vez que un tile de OSM falla al cargar. */
  onTileError?: () => void;
  /** Se invoca cuando carga exitosamente el primer tile (y en los siguientes). */
  onTileLoad?: () => void;
}

// ---------------------------------------------------------------------------
// Controlador interno: vuela al marcador seleccionado y abre su popup.
// Debe estar dentro de <MapContainer> para poder usar useMap().
// ---------------------------------------------------------------------------
function MapController({
  selectedId,
  markerRefs,
}: {
  selectedId?: string | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const marker = markerRefs.current[selectedId];
    if (!marker) return;
    // Centra el mapa en el marcador (sin bajar el zoom si el usuario ya hizo zoom)
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    marker.openPopup();
  }, [selectedId, map, markerRefs]);

  return null;
}

// ---------------------------------------------------------------------------
// Controlador interno: vuela a la ubicación del usuario cuando se obtiene.
// Así, al pulsar "Usar mi ubicación", el mapa se acomoda a donde está la
// persona (no se queda en Medellín).
// ---------------------------------------------------------------------------
function UserLocationController({
  userLocation,
}: {
  userLocation: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;
    // Vuela a la ubicación con un zoom de barrio (sin reducirlo si ya hay más).
    map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  }, [userLocation, map]);

  return null;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
//
// NOTA: `<MapContainer center>` solo se aplica al construir el mapa. Los
// cambios de ciudad NO se animan desde aquí: MapView remonta este componente
// con una `key` derivada del centro, que es determinista. Un flyTo que falle en
// silencio dejaría a la persona mirando la ciudad equivocada.

/**
 * Mapa de Leaflet con tiles de OpenStreetMap.
 *
 * Cargado solo en cliente (sin SSR) a través de next/dynamic desde MapView.
 * Detecta errores y cargas de tiles y los reporta al padre vía onTileError /
 * onTileLoad para que MapView decida si hace fallback a Google Maps.
 */
export default function LeafletMap({
  markers,
  userLocation,
  selectedId,
  onSelect,
  center = DEFAULT_CITY.center,
  zoom = DEFAULT_ZOOM,
  className,
  onTileError,
  onTileLoad,
}: LeafletMapProps) {
  // Mapa de id → instancia L.Marker para abrir popups imperativamente
  const markerRefs = useRef<Record<string, L.Marker>>({});

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        eventHandlers={{
          tileerror: () => onTileError?.(),
          tileload:  () => onTileLoad?.(),
        }}
      />

      {/* Vuela al marcador seleccionado y abre su popup */}
      <MapController selectedId={selectedId} markerRefs={markerRefs} />

      {/* Vuela a la ubicación del usuario cuando se obtiene */}
      <UserLocationController userLocation={userLocation} />

      {/* Marcadores: puntos de ayuda y zonas afectadas (contexto) */}
      {markers.map((m) => {
        const isZone = m.variant === 'zona';
        return (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={isZone ? createZoneIcon() : createPointIcon(m.status, m.kind)}
            // Las zonas quedan por debajo de los puntos de ayuda: si se
            // superponen, gana el lugar al que sí se puede acudir.
            zIndexOffset={isZone ? -500 : 0}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[m.id] = ref;
              } else {
                delete markerRefs.current[m.id];
              }
            }}
            eventHandlers={{
              // Una zona no es seleccionable: no hay ficha que abrir.
              click: () => {
                if (!isZone) onSelect?.(m.id);
              },
            }}
          >
            <Popup>
              <strong className="text-sm">{m.title}</strong>
              {m.subtitle && (
                <span className="mt-1 block text-xs leading-snug">
                  {m.subtitle}
                </span>
              )}
              {isZone && (
                <span className="mt-1 block text-xs font-semibold leading-snug text-rose-700">
                  Zona afectada — no es un punto de ayuda.
                </span>
              )}
            </Popup>
          </Marker>
        );
      })}

      {/* Marcador de ubicación del usuario */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={USER_ICON}
        >
          <Popup>
            <span className="text-sm">Tu ubicación</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
