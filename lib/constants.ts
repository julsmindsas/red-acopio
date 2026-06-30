/**
 * Constantes de presentación y configuración de Red de Acopio.
 */
import {
  MATERIAL_CATEGORIES,
  VERIFICATION_STATUSES,
  type MaterialCategory,
  type VerificationStatus,
} from "./types";

/** Coordenadas aproximadas del centro de Medellín (Parque Berrío). */
export const MEDELLIN_CENTER = { lat: 6.2476, lng: -75.5658 } as const;

/** Zoom inicial del mapa para una vista de ciudad. */
export const DEFAULT_ZOOM = 12;

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
export { MATERIAL_CATEGORIES, VERIFICATION_STATUSES };

/**
 * Nombre del archivo semilla (datos de ejemplo / scrapeados) versionado en el repo.
 * Lo consume el store JSON local y el script de seed de Postgres.
 */
export const SEED_FILE = "data/centers.seed.json";
