/**
 * Registro de fuentes ACTIVAS del scraper.
 *
 * Agrega aquí cada adaptador real que quieras ejecutar. El orquestador
 * (`scripts/scrape.ts`) recorre este array y llama a `source.run()` en cada uno.
 *
 * Solo se listan fuentes con datos REALES extraídos de páginas públicas (con su
 * URL). La plantilla `_template.ts` NO se incluye a propósito (es solo guía).
 *
 * EMERGENCIA ACTIVA: sismo de Chocó del 10 de agosto de 2026.
 * Los adaptadores de la emergencia de Venezuela (`eltiempo-medellin`,
 * `pulzo-colombia`, `laika-mascotas`) se conservan en disco como archivo
 * histórico, pero están FUERA del registro: sus centros recogían ayuda para
 * Venezuela y publicarlos hoy mandaría a la gente a puntos que no atienden esta
 * emergencia. Para reactivarlos, vuelve a importarlos aquí.
 */

import type { Source } from "./types";
import { semanaManizales } from "./semana-manizales";
import { portalesOficiales } from "./portales-oficiales";

export const sources: Source[] = [
  semanaManizales, //   3 albergues (Manizales) — prensa citando a la Alcaldía, sin_verificar
  portalesOficiales, // 0 centros: monitorea alcaldías y UNGRD y reporta pistas para curar a mano
];
