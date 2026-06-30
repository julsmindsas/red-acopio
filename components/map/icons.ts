/**
 * Íconos de Leaflet para los marcadores del mapa.
 *
 * Se usan divIcons (HTML puro) en lugar de imágenes para evitar el bug clásico
 * de íconos rotos que se produce con bundlers (webpack/turbopack) al procesar
 * las rutas de imágenes internas de Leaflet.
 *
 * Este módulo solo se importa desde LeafletMap, que carga con { ssr: false },
 * por lo que es seguro ejecutar L.divIcon() a nivel de módulo.
 */

import L from 'leaflet';
import type { VerificationStatus } from '@/lib/types';

// Paleta coherente con STATUS_META en lib/constants.ts:
//   verificado   → esmeralda (emerald)
//   sin_verificar → ámbar    (amber)
//   reportado    → cielo     (sky)
const STATUS_COLORS: Record<VerificationStatus, { bg: string; border: string }> = {
  verificado:    { bg: '#10b981', border: '#059669' },
  sin_verificar: { bg: '#f59e0b', border: '#d97706' },
  reportado:     { bg: '#0ea5e9', border: '#0284c7' },
};

/**
 * Crea un `L.DivIcon` circular con el color del estado de verificación.
 * Se llama una vez por marcador en cada render de LeafletMap.
 */
export function createStatusIcon(status: VerificationStatus): L.DivIcon {
  const { bg, border } = STATUS_COLORS[status];
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 22px;
      height: 22px;
      background: ${bg};
      border: 2.5px solid ${border};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

/** Ícono de posición del usuario: círculo azul con anillo blanco. */
export const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px;
    height: 16px;
    background: #3b82f6;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});
