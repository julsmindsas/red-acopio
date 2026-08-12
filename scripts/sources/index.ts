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
import { elDiarioPereira } from "./eldiario-pereira";
import { infobaeAcopiosNacionales } from "./infobae-acopios-nacionales";
import { alcaldiasOficiales } from "./alcaldias-oficiales";
import { portalesOficiales } from "./portales-oficiales";

export const sources: Source[] = [
  alcaldiasOficiales, //        3 puntos (Cali, Armenia) — publicación oficial, verificado
  semanaManizales, //           3 albergues (Manizales) — prensa citando a la Alcaldía
  elDiarioPereira, //          13 puntos (Pereira: 6 albergues + 7 acopios) — prensa local
  infobaeAcopiosNacionales, // 12 puntos (Bogotá, Cali, Medellín, Barranquilla, sangre en Manizales)
  portalesOficiales, //         0 puntos: monitorea 13 entidades y reporta pistas para curar a mano
];
