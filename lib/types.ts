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

/**
 * Tipo de punto en el mapa.
 *
 * Una emergencia no se atiende solo con donaciones: quien perdió su casa
 * necesita un albergue, quien está herido una brigada médica y quien se quedó
 * sin acueducto un punto de agua. Todos son puntos geolocalizados con horario y
 * contacto, así que comparten la misma estructura que un centro de acopio.
 */
export const POINT_KINDS = [
  "acopio", // recibe donaciones
  "albergue", // alojamiento temporal para damnificados
  "brigada_medica", // atención médica / primeros auxilios
  "punto_agua", // distribución de agua potable
] as const;

export type PointKind = (typeof POINT_KINDS)[number];

/**
 * Estado operativo del punto *en este momento*.
 *
 * Distinto de `VerificationStatus` (que habla de la confianza en el dato):
 * este campo habla de si el punto está funcionando y si puede recibir más.
 * Es la señal que evita el colapso logístico clásico de toda emergencia:
 * decenas de personas llevando donaciones a un centro que ya está saturado.
 */
export const OPERATIONAL_STATUSES = [
  "recibiendo", // abierto y con capacidad
  "lleno", // abierto pero saturado: no llevar más por ahora
  "cerrado", // no está operando
  "desconocido", // sin información reciente
] as const;

export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

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
  /**
   * Qué es este punto. Los datos anteriores al sismo de Colombia no traen el
   * campo, así que los stores lo normalizan a `"acopio"` al leer.
   */
  kind: PointKind;
  /** Teléfono de contacto. `null` si se desconoce. */
  phone: string | null;
  /**
   * Materiales que el punto acepta. Para albergues, brigadas médicas y puntos
   * de agua puede venir vacío (no reciben donaciones).
   */
  materials: MaterialCategory[];
  /**
   * Lo que el punto **más necesita ahora**. Subconjunto de `materials` que la
   * UI destaca para dirigir las donaciones a donde hacen falta.
   */
  urgentNeeds?: MaterialCategory[];
  /**
   * Lo que el punto pidió **no** seguir recibiendo (normalmente porque está
   * saturado de eso). Evita que la gente lleve lo que sobra.
   */
  notReceiving?: MaterialCategory[];
  /** Si está funcionando ahora y si puede recibir más. */
  operational: OperationalStatus;
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
  kind?: PointKind;
  phone?: string | null;
  materials?: MaterialCategory[];
  urgentNeeds?: MaterialCategory[];
  notReceiving?: MaterialCategory[];
  operational?: OperationalStatus;
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
  /** Qué es el punto. Si se omite, el servidor asume `"acopio"`. */
  kind?: PointKind;
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
  /** Determina el icono del pin (acopio, albergue, brigada médica, agua). */
  kind: PointKind;
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
