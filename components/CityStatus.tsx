"use client";

import Link from "next/link";
import type { AffectedCity } from "@/lib/constants";

/*
 * Estado de una ciudad sin puntos publicados.
 * -------------------------------------------------------------------------
 * En las primeras horas de un desastre, las alcaldías están rescatando gente,
 * no actualizando su web. Habrá ciudades gravemente afectadas para las que
 * todavía no exista un solo albergue publicado con nombre y dirección.
 *
 * Ante eso, un mapa vacío es lo peor que podemos mostrar: parece que ahí no
 * pasó nada. Este panel dice explícitamente qué se sabe de la ciudad, admite
 * que aún no hay puntos confirmados y manda a los canales que sí están
 * comunicando en vivo — además de a la línea de emergencia.
 */
export default function CityStatus({
  city,
  nearest,
}: {
  city: AffectedCity;
  /** Punto de ayuda más cercano del país, si existe alguno. */
  nearest: {
    name: string;
    city: string | null;
    km: number;
    onSelect: () => void;
  } | null;
}) {
  return (
    <div className="rounded-2xl border border-accent-300 bg-accent-50 p-5">
      <h2 className="text-base font-bold text-accent-900">
        Todavía no hay puntos confirmados en {city.name}
      </h2>

      {city.note && (
        <p className="mt-2 text-sm leading-relaxed text-accent-900/90">
          <strong className="font-semibold">
            {city.name}, {city.department}:
          </strong>{" "}
          {city.note}
        </p>
      )}

      <p className="mt-2 text-sm leading-relaxed text-accent-900/90">
        Las autoridades no han publicado albergues ni centros de acopio con
        dirección para esta ciudad. En vez de mostrarte un mapa vacío, te
        dejamos dónde mirar en vivo — y aquí no inventamos puntos.
      </p>

      {/* Dato accionable en vez de un mapa vacío: dónde está lo más cercano */}
      {nearest && (
        <button
          type="button"
          onClick={nearest.onSelect}
          className="mt-3 flex w-full min-h-11 items-center gap-3 rounded-xl border border-accent-400 bg-surface px-4 py-3 text-left transition-colors hover:bg-accent-100"
        >
          <span aria-hidden="true" className="text-xl">
            📍
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">
              Lo más cercano: {nearest.name}
            </span>
            <span className="block text-xs text-foreground/60">
              A {Math.round(nearest.km)} km
              {nearest.city ? ` · ${nearest.city}` : ""} · tócalo para verlo en
              el mapa
            </span>
          </span>
        </button>
      )}

      {city.channels && city.channels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {city.channels.map((ch) => (
            <a
              key={ch.href}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-400 bg-surface px-4 text-sm font-semibold text-accent-900 transition-colors hover:bg-accent-100"
            >
              {ch.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-accent-300 pt-4">
        <a
          href="tel:123"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-rose-600 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-700"
        >
          <span aria-hidden="true">🚨</span> Emergencia: 123
        </a>
        <Link
          href="/ayuda"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-400 bg-surface px-4 text-sm font-semibold text-accent-900 transition-colors hover:bg-accent-100"
        >
          Todas las líneas y cómo ayudar
        </Link>
        <Link
          href="/reportar"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-400 bg-surface px-4 text-sm font-semibold text-accent-900 transition-colors hover:bg-accent-100"
        >
          <span aria-hidden="true">＋</span> Conozco un punto en {city.name}
        </Link>
      </div>
    </div>
  );
}
