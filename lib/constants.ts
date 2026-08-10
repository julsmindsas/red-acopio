/**
 * Constantes de presentación y configuración de Red de Acopio.
 */
import {
  MATERIAL_CATEGORIES,
  OPERATIONAL_STATUSES,
  POINT_KINDS,
  VERIFICATION_STATUSES,
  type LatLng,
  type MaterialCategory,
  type OperationalStatus,
  type PointKind,
  type VerificationStatus,
} from "./types";

/** Coordenadas aproximadas del centro de Medellín (Parque Berrío). */
export const MEDELLIN_CENTER = { lat: 6.2476, lng: -75.5658 } as const;

/** Zoom inicial del mapa para una vista de ciudad. */
export const DEFAULT_ZOOM = 12;

// ---------------------------------------------------------------------------
// Emergencia activa
// ---------------------------------------------------------------------------

/**
 * Datos del evento que la aplicación está atendiendo.
 *
 * Centralizados aquí para que reorientar la app a otra emergencia sea cambiar
 * este objeto y el catálogo de ciudades, no rastrear textos por toda la UI.
 */
export const EMERGENCY = {
  slug: "sismo-colombia-2026",
  title: "Sismo de Chocó",
  /** Fecha y hora local (America/Bogotá) del evento principal. */
  occurredAt: "2026-08-10T07:34:00-05:00",
  magnitude: 7.4,
  epicenter: "San José del Palmar, Chocó",
  /** Profundidad reportada por el Servicio Geológico Colombiano, en km. */
  depthKm: 93.7,
  country: "Colombia",
} as const;

/**
 * Ciudades y municipios con afectación reportada, de mayor a menor impacto.
 *
 * Sustituyen al anclaje fijo a Medellín: el mapa arranca en la ciudad más
 * cercana a quien lo abre. Las coordenadas apuntan al centro urbano.
 */
export const AFFECTED_CITIES: {
  slug: string;
  name: string;
  department: string;
  center: LatLng;
  /** Nota corta sobre la afectación, mostrada en el selector. */
  note?: string;
}[] = [
  {
    slug: "manizales",
    name: "Manizales",
    department: "Caldas",
    center: { lat: 5.0689, lng: -75.5174 },
    note: "Municipio más afectado: edificios colapsados y albergues activos.",
  },
  {
    slug: "pereira",
    name: "Pereira",
    department: "Risaralda",
    center: { lat: 4.8133, lng: -75.6961 },
    note: "Daños estructurales y afectación del aeropuerto Matecaña.",
  },
  {
    slug: "armenia",
    name: "Armenia",
    department: "Quindío",
    center: { lat: 4.5339, lng: -75.6811 },
    note: "Afectaciones en edificaciones del Eje Cafetero.",
  },
  {
    slug: "cali",
    name: "Cali",
    department: "Valle del Cauca",
    center: { lat: 3.4516, lng: -76.532 },
    note: "Edificios con daño estructural reportado.",
  },
  {
    slug: "quibdo",
    name: "Quibdó",
    department: "Chocó",
    center: { lat: 5.6947, lng: -76.6611 },
    note: "Heridos y daños; afectación del aeropuerto El Caraño.",
  },
  {
    slug: "san-jose-del-palmar",
    name: "San José del Palmar",
    department: "Chocó",
    center: { lat: 4.8964, lng: -76.2286 },
    note: "Epicentro del sismo.",
  },
  {
    slug: "medellin",
    name: "Medellín",
    department: "Antioquia",
    center: MEDELLIN_CENTER,
    note: "Sin afectación mayor: punto de recolección y envío de ayuda.",
  },
  {
    slug: "bogota",
    name: "Bogotá",
    department: "Cundinamarca",
    center: { lat: 4.7110, lng: -74.0721 },
    note: "Sede del PMU nacional; punto de recolección y envío de ayuda.",
  },
];

/** Ciudad por defecto cuando no hay geolocalización: la más afectada. */
export const DEFAULT_CITY = AFFECTED_CITIES[0];

// ---------------------------------------------------------------------------
// Tipos de punto y estado operativo
// ---------------------------------------------------------------------------

/** Etiquetas, emoji y texto de ayuda para cada tipo de punto. */
export const POINT_KIND_META: Record<
  PointKind,
  { label: string; plural: string; emoji: string; description: string }
> = {
  acopio: {
    label: "Centro de acopio",
    plural: "Centros de acopio",
    emoji: "📦",
    description: "Recibe donaciones para los damnificados.",
  },
  albergue: {
    label: "Albergue",
    plural: "Albergues",
    emoji: "🏠",
    description: "Alojamiento temporal para quienes no pueden volver a casa.",
  },
  brigada_medica: {
    label: "Brigada médica",
    plural: "Brigadas médicas",
    emoji: "🚑",
    description: "Atención médica y primeros auxilios.",
  },
  punto_agua: {
    label: "Punto de agua",
    plural: "Puntos de agua",
    emoji: "🚰",
    description: "Distribución de agua potable.",
  },
};

/** Etiqueta, color y significado de cada estado operativo. */
export const OPERATIONAL_META: Record<
  OperationalStatus,
  { label: string; badgeClass: string; description: string; emoji: string }
> = {
  recibiendo: {
    label: "Recibiendo",
    emoji: "🟢",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
    description: "Abierto y con capacidad para recibir.",
  },
  lleno: {
    label: "Saturado",
    emoji: "🟠",
    badgeClass: "bg-orange-100 text-orange-900 ring-orange-600/20",
    description: "Abierto pero sin capacidad. No lleves más por ahora.",
  },
  cerrado: {
    label: "Cerrado",
    emoji: "🔴",
    badgeClass: "bg-rose-100 text-rose-800 ring-rose-600/20",
    description: "No está operando en este momento.",
  },
  desconocido: {
    label: "Estado sin confirmar",
    emoji: "⚪",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20",
    description: "No tenemos información reciente. Llama antes de ir.",
  },
};

/** Etiquetas legibles para cada categoría de material. */
export const MATERIAL_LABELS: Record<MaterialCategory, string> = {
  alimentos: "Alimentos no perecederos",
  agua: "Agua",
  ropa: "Ropa",
  medicamentos: "Medicamentos",
  aseo: "Aseo personal",
  bebes: "Insumos para bebés",
  cobijas: "Cobijas / abrigo",
  herramientas: "Herramientas",
  mascotas: "Alimento y cuidado de mascotas",
  otros: "Otros",
};

/** Emoji asociado a cada material (para chips compactos en móvil). */
export const MATERIAL_EMOJI: Record<MaterialCategory, string> = {
  alimentos: "🥫",
  agua: "💧",
  ropa: "👕",
  medicamentos: "💊",
  aseo: "🧼",
  bebes: "🍼",
  cobijas: "🛏️",
  herramientas: "🔧",
  mascotas: "🐾",
  otros: "📦",
};

/** Etiqueta y color (clase Tailwind) para cada estado de verificación. */
export const STATUS_META: Record<
  VerificationStatus,
  { label: string; badgeClass: string; description: string }
> = {
  verificado: {
    label: "Verificado",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
    description: "Confirmado contra una fuente oficial.",
  },
  sin_verificar: {
    label: "Sin verificar",
    badgeClass: "bg-amber-100 text-amber-800 ring-amber-600/20",
    description: "Información de fuente pública aún no confirmada. Verifica antes de ir.",
  },
  reportado: {
    label: "Reportado por la comunidad",
    badgeClass: "bg-sky-100 text-sky-800 ring-sky-600/20",
    description: "Reporte ciudadano pendiente de revisión.",
  },
};

/** Re-export por conveniencia para iterar en formularios/filtros. */
export {
  MATERIAL_CATEGORIES,
  OPERATIONAL_STATUSES,
  POINT_KINDS,
  VERIFICATION_STATUSES,
};

/**
 * Nombre del archivo semilla (datos de ejemplo / scrapeados) versionado en el repo.
 * Lo consume el store JSON local y el script de seed de Postgres.
 */
export const SEED_FILE = "data/centers.seed.json";
