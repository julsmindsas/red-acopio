/**
 * Registro de fuentes ACTIVAS del scraper.
 *
 * Agrega aquí cada adaptador real que quieras ejecutar. El orquestador
 * (`scripts/scrape.ts`) recorre este array y llama a `source.run()` en cada uno.
 *
 * Solo se listan fuentes con datos REALES extraídos de páginas públicas (con su
 * URL). La plantilla `_template.ts` NO se incluye a propósito (es solo guía).
 */

import type { Source } from "./types";
import { elTiempoMedellin } from "./eltiempo-medellin";
import { pulzoColombia } from "./pulzo-colombia";

export const sources: Source[] = [
  elTiempoMedellin, // 8 centros (Medellín, Itagüí, Bello, Envigado) — prensa, sin_verificar
  pulzoColombia, //    1 centro (El Minuto de Dios, Medellín) — prensa, sin_verificar
];
