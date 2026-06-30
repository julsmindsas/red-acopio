/**
 * Tipos compartidos de Red de Acopio.
 *
 * Este archivo es el "contrato" central del proyecto: tanto el frontend (mapa,
 * listado, formulario) como el backend (API, base de datos) dependen de estos
 * tipos. Si necesitas agregar un campo a un centro de acopio, hazlo aquí primero.
 */

/**
 * Categorías de material que un centro de acopio puede recibir.
 * Es una tupla `as const` para poder derivar tanto el tipo de TypeScript como el
 * enum de validación (zod) a partir de una única fuente de verdad.
 */
export const MATERIAL_CATEGORIES = [
  "alimentos",
  "agua",
  "ropa",
  "medicamentos",
  "aseo",
  "bebes",
  "cobijas",
  "herramientas",
  "mascotas",
  "otros",
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** Estado de verificación de la información de un centro. */
export const VERIFICATION_STATUSES = [
  "verificado", // confirmado contra una fuente oficial
  "sin_verificar", // proviene de scraping u origen no confirmado
  "reportado", // enviado por la ciudadanía vía el formulario, pendiente de revisión
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Par de coordenadas geográficas. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Un centro de acopio tal como se almacena y se expone por la API.
 */
export interface Center {
  id: string;
  name: string;
  address: string;
  /** Teléfono de contacto. `null` si no se conoce. */
  phone: string | null;
  /** Materiales que el centro acepta. */
  materials: MaterialCategory[];
  /** Horario en texto libre, ej. "Lun-Vie 8:00am-5:00pm". */
  schedule: string;
  lat: number;
  lng: number;
  /** Ciudad/municipio (ej. "Medellín", "Itagüí"). Opcional. */
  city?: string | null;
  /** País (ej. "Colombia"). Opcional; por defecto Colombia en datos locales. */
  country?: string | null;
  /** Notas o aclaraciones adicionales. */
  notes: string | null;
  /** Origen del dato: URL de la fuente, "reporte-ciudadano", "acopiove.org", etc. `null` si se desconoce. */
  source: string | null;
  status: VerificationStatus;
  /**
   * `true` si el centro proviene de una fuente externa de solo lectura (p. ej. la
   * API oficial de acopiove.org) y por tanto NO es editable desde el panel admin.
   * Los centros locales (reportes/curados) son editables.
   */
  readOnly?: boolean;
  /** Fecha de creación en formato ISO 8601. */
  createdAt: string;
  /** Fecha de última actualización en formato ISO 8601. */
  updatedAt: string;
}

/**
 * Campos editables de un centro desde el panel administrativo.
 * Todos opcionales: solo se actualiza lo que venga presente.
 */
export interface CenterPatch {
  name?: string;
  address?: string;
  phone?: string | null;
  materials?: MaterialCategory[];
  schedule?: string;
  lat?: number;
  lng?: number;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  status?: VerificationStatus;
}

/**
 * Datos que envía un ciudadano al reportar un nuevo centro de acopio.
 * Es el subconjunto de `Center` que el usuario controla; el resto de campos
 * (id, status, fechas) los asigna el servidor.
 */
export interface CenterInput {
  name: string;
  address: string;
  phone?: string | null;
  materials: MaterialCategory[];
  schedule: string;
  lat: number;
  lng: number;
  notes?: string | null;
}

/** Un centro enriquecido con la distancia (en km) hasta la ubicación del usuario. */
export interface CenterWithDistance extends Center {
  /** Distancia en kilómetros al usuario, o `null` si no hay geolocalización. */
  distanceKm: number | null;
}

// ---------------------------------------------------------------------------
// Contrato del mapa
// ---------------------------------------------------------------------------
// Estos tipos los consume tanto el componente de mapa (proveedor Leaflet/Google)
// como la UI que lo renderiza. Mantenerlos aquí evita acoplar la UI a una
// implementación concreta del mapa.

/** Proveedores de mapa soportados. */
export type MapProviderName = "leaflet" | "google";

/** Marcador genérico, independiente del proveedor de mapa. */
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status: VerificationStatus;
}

/**
 * Props del componente de mapa de alto nivel (`<MapView />`).
 *
 * El componente intenta renderizar con Leaflet + OpenStreetMap y hace
 * *fallback* automático a Google Maps si los tiles de OSM fallan al cargar
 * (y existe una API key de Google configurada).
 */
export interface MapViewProps {
  markers: MapMarker[];
  /** Ubicación del usuario, si la concedió. */
  userLocation: LatLng | null;
  /** Id del marcador actualmente seleccionado. */
  selectedId?: string | null;
  /** Se invoca cuando el usuario toca un marcador. */
  onSelect?: (id: string) => void;
  /** Centro inicial del mapa. Por defecto, el centro de Medellín. */
  center?: LatLng;
  /** Nivel de zoom inicial. */
  zoom?: number;
  className?: string;
  /** Fuerza un proveedor concreto; si se omite, intenta Leaflet con fallback a Google. */
  forceProvider?: MapProviderName;
  /** Notifica cambios de proveedor (útil para mostrar un aviso en la UI). */
  onProviderChange?: (provider: MapProviderName) => void;
}

// ---------------------------------------------------------------------------
// Contrato de la API
// ---------------------------------------------------------------------------

/** Respuesta estándar de error de la API. */
export interface ApiError {
  error: string;
  /** Errores de validación por campo (cuando aplica). */
  fields?: Record<string, string[]>;
}
