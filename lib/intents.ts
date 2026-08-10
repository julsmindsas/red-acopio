/**
 * Intenciones de entrada: la primera decisión que toma quien abre la app.
 *
 * Vive en `lib/` —y no en el componente— a propósito: lo consumen tanto el
 * Server Component de `/mapa` (para resolver el deep-link `?necesito=`) como el
 * `IntentBar` de cliente. Un módulo marcado con `"use client"` no puede exportar
 * datos hacia el servidor: al otro lado solo llega una referencia de cliente.
 */
import type { PointKind } from "./types";

export interface Intent {
  /** Valor del parámetro `?necesito=` en la URL. */
  id: string;
  emoji: string;
  /** Redactado en primera persona: así lo diría quien lo necesita. */
  title: string;
  /** Traducción a lo que verá en el mapa. */
  subtitle: string;
  /** Tipos de punto que activa. */
  kinds: PointKind[];
}

export const INTENTS: Intent[] = [
  {
    id: "refugio",
    emoji: "🏠",
    title: "Busco dónde dormir",
    subtitle: "Albergues abiertos",
    kinds: ["albergue"],
  },
  {
    id: "atencion",
    emoji: "🚑",
    title: "Necesito atención o agua",
    subtitle: "Brigadas médicas y puntos de agua",
    kinds: ["brigada_medica", "punto_agua"],
  },
  {
    id: "donar",
    emoji: "📦",
    title: "Quiero donar",
    subtitle: "Centros de acopio",
    kinds: ["acopio"],
  },
];

/** Busca una intención por el valor de `?necesito=`. */
export function findIntent(id: string | undefined): Intent | undefined {
  return id ? INTENTS.find((i) => i.id === id) : undefined;
}
