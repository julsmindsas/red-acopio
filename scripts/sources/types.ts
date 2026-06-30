/**
 * Tipos del módulo de scraping de Red de Acopio.
 *
 * IMPORTANTE: estos tipos son INTERNOS del scraper. El "contrato" de la app vive
 * en `@/lib/types` (Center, MaterialCategory, etc.) y NO se modifica desde aquí.
 * El orquestador (`scripts/scrape.ts`) se encarga de transformar un `RawCenter`
 * (lo que una fuente logra extraer, sin geocodificar y con materiales en texto
 * libre) en un `Center` ya normalizado (materiales mapeados, lat/lng, id, etc.).
 */

/**
 * Centro de acopio "crudo": lo que un adaptador de fuente extrae de una página.
 *
 * Casi todo es opcional porque las fuentes reales (notas de prensa) rara vez
 * publican todos los campos. La única obligación es `sourceUrl`: NUNCA se
 * registra un centro sin la URL pública de donde salió el dato (regla de
 * honestidad del proyecto).
 */
export interface RawCenter {
  /** Nombre del lugar u organización tal como aparece en la fuente. */
  name: string;
  /** Dirección en texto libre, si la fuente la publica. */
  address?: string;
  /** Teléfono de contacto, si la fuente lo publica. */
  phone?: string;
  /**
   * Materiales que recibe, en TEXTO LIBRE y en español, tal como los nombra la
   * fuente (ej. "alimentos no perecederos", "pañales", "kits de aseo"). El
   * orquestador los mapea a las categorías del contrato (`MaterialCategory`).
   */
  materials?: string[];
  /** Horario en texto libre (ej. "8:00 a.m. - 5:00 p.m."). */
  schedule?: string;
  /** URL pública real de la fuente. OBLIGATORIA. */
  sourceUrl: string;
  /** Fragmento de texto original de respaldo (opcional, para auditoría). */
  rawText?: string;
  /** Latitud, si la fuente ya la trae (raro). Si falta, la calcula el orquestador. */
  lat?: number;
  /** Longitud, si la fuente ya la trae (raro). Si falta, la calcula el orquestador. */
  lng?: number;
  /** Notas/aclaraciones que el adaptador quiera dejar (ej. dirección aproximada). */
  notes?: string;

  // --------------------------------------------------------------------------
  // Campos OPCIONALES de ayuda (extensión del scraper; no son parte del
  // contrato de la app). Sirven para que el adaptador controle la calidad de
  // la geocodificación y la verificación de frescura.
  // --------------------------------------------------------------------------
  /** Municipio (Medellín, Itagüí, Bello, Envigado…). Útil para id y notas. */
  municipality?: string;
  /**
   * Consulta EXACTA que el orquestador debe enviar a Nominatim para geocodificar
   * este centro. Permite afinar la precisión (ej. usar solo la calle, o el
   * centroide de un barrio cuando la fuente no publicó dirección exacta).
   * Si se omite, el orquestador arma la consulta a partir de `address`.
   */
  geoQuery?: string;
  /**
   * Token distintivo del nombre (ej. "Tepuy", "Grupo Mega") que el adaptador usa
   * para comprobar, al descargar la página real, que el centro SIGUE apareciendo
   * en la fuente. Es solo un chequeo de frescura; no altera los datos.
   */
  verifyToken?: string;
}

/**
 * Un adaptador de fuente. Cada fuente pública (un medio, una alcaldía, etc.)
 * implementa esta interfaz en su propio archivo dentro de `scripts/sources/`.
 */
export interface Source {
  /** Identificador corto y estable (slug). Se usa para nombrar `raw-<id>.json`. */
  id: string;
  /** Etiqueta legible para los logs (ej. "El Tiempo – Medellín"). */
  label: string;
  /** URL principal de la fuente. */
  url: string;
  /** Descarga/parsea la fuente y devuelve los centros crudos que logró extraer. */
  run(): Promise<RawCenter[]>;
}
