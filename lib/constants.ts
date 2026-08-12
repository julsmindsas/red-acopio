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

/**
 * Zoom para una vista regional (varios municipios en pantalla).
 *
 * Se usa cuando la ciudad activa no tiene puntos: a zoom de barrio solo se
 * verían calles vacías, y el mapa parecería roto.
 */
export const REGIONAL_ZOOM = 8;

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
export interface AffectedCity {
  slug: string;
  name: string;
  department: string;
  center: LatLng;
  /** Nota corta sobre la afectación, mostrada en el selector. */
  note?: string;
  /**
   * `true` si la ciudad tiene daño reportado por el sismo. Solo estas se
   * dibujan en el mapa como zona afectada; Bogotá o Medellín aparecen en el
   * selector porque desde allí se envía ayuda, no porque estén golpeadas.
   */
  damaged?: boolean;
  /**
   * Canales oficiales de la zona.
   *
   * Existen porque, en las primeras horas, los portales institucionales todavía
   * no publican nada y las autoridades comunican por redes: cuando no tenemos
   * puntos que mostrar para una ciudad, al menos indicamos dónde mirar en vivo
   * en vez de dejar un mapa vacío.
   */
  channels?: { label: string; href: string }[];
}

export const AFFECTED_CITIES: AffectedCity[] = [
  {
    slug: "manizales",
    name: "Manizales",
    department: "Caldas",
    damaged: true,
    center: { lat: 5.0689, lng: -75.5174 },
    note: "5 fallecidos, 78 heridos y unos 4.000 damnificados. Tres albergues habilitados.",
    channels: [
      { label: "Alcaldía de Manizales", href: "https://manizales.gov.co/" },
    ],
  },
  {
    slug: "pereira",
    name: "Pereira",
    department: "Risaralda",
    damaged: true,
    center: { lat: 4.8133, lng: -75.6961 },
    note: "73 fallecidos, 85 heridos y 37 desaparecidos; 66 edificios con colapso total. Seis albergues y siete centros de acopio.",
    channels: [
      { label: "Alcaldía de Pereira", href: "https://www.pereira.gov.co/" },
      { label: "Alcaldía en X", href: "https://x.com/Alcaldiapereira" },
      { label: "Gobernación de Risaralda en X", href: "https://x.com/Gob_Risaralda" },
    ],
  },
  {
    slug: "armenia",
    name: "Armenia",
    department: "Quindío",
    damaged: true,
    center: { lat: 4.5339, lng: -75.6811 },
    note: "174 heridos y 5 edificios colapsados. El aeropuerto suspendió operaciones.",
    channels: [
      { label: "Alcaldía de Armenia", href: "https://www.armenia.gov.co/" },
    ],
  },
  {
    slug: "cali",
    name: "Cali",
    department: "Valle del Cauca",
    damaged: true,
    center: { lat: 3.4516, lng: -76.532 },
    note: "95 fallecidos, 949 heridos y 239 personas atrapadas; 56 estructuras colapsadas y 10 hospitales fuera de servicio.",
    channels: [
      { label: "Alcaldía de Cali", href: "https://www.cali.gov.co/" },
      { label: "Alcaldía en X", href: "https://x.com/AlcaldiaDeCali" },
    ],
  },
  {
    slug: "quibdo",
    name: "Quibdó",
    department: "Chocó",
    damaged: true,
    center: { lat: 5.6947, lng: -76.6611 },
    note: "14 fallecidos, 138 heridos y 5 desaparecidos en el departamento; ~3.500 damnificados en 21 de los 31 municipios.",
    channels: [
      { label: "Gobernación del Chocó", href: "https://www.choco.gov.co/" },
      { label: "Gobernadora en X", href: "https://x.com/NubiaCarolinaCC" },
    ],
  },
  {
    slug: "san-jose-del-palmar",
    name: "San José del Palmar",
    department: "Chocó",
    damaged: true,
    center: { lat: 4.8964, lng: -76.2286 },
    note: "Epicentro del sismo. La respuesta la encabeza el Gobierno nacional.",
    channels: [
      { label: "Gobernación del Chocó", href: "https://www.choco.gov.co/" },
      { label: "UNGRD", href: "https://portal.gestiondelriesgo.gov.co/" },
    ],
  },
  {
    slug: "medellin",
    name: "Medellín",
    department: "Antioquia",
    center: MEDELLIN_CENTER,
    note: "Sin afectación mayor: punto de recolección y envío de ayuda.",
    channels: [
      { label: "Alcaldía de Medellín", href: "https://www.medellin.gov.co/" },
    ],
  },
  {
    slug: "dosquebradas",
    name: "Dosquebradas",
    department: "Risaralda",
    damaged: true,
    center: { lat: 4.8358, lng: -75.6797 },
    note: "Municipio vecino de Pereira, también afectado. Banco de Alimentos habilitado como acopio.",
  },
  {
    slug: "buenaventura",
    name: "Buenaventura",
    department: "Valle del Cauca",
    center: { lat: 3.8801, lng: -77.0313 },
    note: "Uno de los principales puntos de recepción de víveres para la zona del Pacífico.",
  },
  // Ciudades sin afectación mayor desde las que se envía ayuda. Aparecen en el
  // selector para que quien quiera donar encuentre su punto más cercano.
  {
    slug: "cartagena",
    name: "Cartagena",
    department: "Bolívar",
    center: { lat: 10.3910, lng: -75.4794 },
    note: "Sin afectación: tres puntos de acopio para enviar ayuda.",
  },
  {
    slug: "bucaramanga",
    name: "Bucaramanga",
    department: "Santander",
    center: { lat: 7.1193, lng: -73.1227 },
    note: "Sin afectación: puntos de acopio en la Alcaldía y Centroabastos.",
  },
  {
    slug: "monteria",
    name: "Montería",
    department: "Córdoba",
    center: { lat: 8.7479, lng: -75.8814 },
    note: "Sin afectación: acopio en el Coliseo Miguel Happy Lora.",
  },
  {
    slug: "santa-marta",
    name: "Santa Marta",
    department: "Magdalena",
    center: { lat: 11.2408, lng: -74.1990 },
    note: "Sin afectación: acopio en la Oficina de Gestión de Riesgo.",
  },
  {
    slug: "valledupar",
    name: "Valledupar",
    department: "Cesar",
    center: { lat: 10.4631, lng: -73.2532 },
    note: "Sin afectación: Centro de Solidaridad, que también recibe elementos para mascotas.",
  },
  {
    slug: "barranquilla",
    name: "Barranquilla",
    department: "Atlántico",
    center: { lat: 10.9878, lng: -74.7889 },
    note: "Sin afectación: centro de acopio abierto 24 horas para enviar ayuda.",
    channels: [
      { label: "Alcaldía de Barranquilla", href: "https://www.barranquilla.gov.co/" },
    ],
  },
  {
    slug: "bogota",
    name: "Bogotá",
    department: "Cundinamarca",
    center: { lat: 4.7110, lng: -74.0721 },
    note: "Sede del PMU nacional. Seis centros de acopio y 100 rescatistas enviados a las zonas afectadas.",
    channels: [
      { label: "UNGRD", href: "https://portal.gestiondelriesgo.gov.co/" },
      { label: "Alcaldía de Bogotá", href: "https://bogota.gov.co/" },
    ],
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
