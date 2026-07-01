"use client";

import { track } from "@vercel/analytics";
import { STATUS_META } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { CenterWithDistance } from "@/lib/types";
import MaterialChips from "./MaterialChips";
import StatusBadge from "./StatusBadge";

/*
 * Tarjeta de un centro de acopio.
 * ------------------------------------------------------------------------
 * Patrón de accesibilidad: el área informativa es un <button> (selecciona el
 * centro y lo sincroniza con el mapa), y las acciones "Llamar" / "Cómo llegar"
 * son enlaces independientes fuera de ese botón (evitamos anidar elementos
 * interactivos, que rompería la navegación por teclado y lectores de pantalla).
 *
 * POSTURA DE DATOS (crítica): si el centro NO está "verificado", mostramos un
 * aviso de precaución visible para que la persona confirme antes de acudir.
 *
 * ATRIBUCIÓN DE FUENTE: los centros oficiales provienen de la red acopiove.org
 * (read-only). Mostramos una etiqueta sutil con enlace a la fuente. Como el
 * área informativa es un <button>, la atribución (que incluye un enlace) va
 * FUERA de ese botón para no anidar elementos interactivos.
 */

interface CenterCardProps {
  center: CenterWithDistance;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Normaliza el teléfono para un enlace `tel:` (deja solo dígitos y "+"). */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Enlace de indicaciones hacia las coordenadas del centro (Google Maps). */
function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Registra una consulta al centro (para "centros más consultados" del panel).
 * Fire-and-forget con `keepalive` para que sobreviva a la navegación; nunca
 * rompe la experiencia si falla.
 */
function recordVisit(id: string, name: string): void {
  try {
    fetch("/api/metrics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ centerId: id, centerName: name }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* no-op */
  }
}

export default function CenterCard({
  center,
  selected,
  onSelect,
}: CenterCardProps) {
  const distance = formatDistance(center.distanceKm);
  const isVerified = center.status === "verificado";

  // Origen del dato para la atribución:
  //  - oficial: proviene de la red acopiove.org (o cualquier fuente read-only).
  //  - comunitario: aporte ciudadano aún pendiente de revisión.
  const isOfficial = center.source === "acopiove.org" || center.readOnly === true;
  const isCommunity = !isOfficial && center.status === "reportado";

  return (
    <article
      id={`center-${center.id}`}
      aria-current={selected ? "true" : undefined}
      className={`group overflow-hidden rounded-2xl border bg-surface transition-all ${
        selected
          ? "border-brand-500 ring-2 ring-brand-500/40 shadow-md shadow-brand-600/10"
          : "border-border hover:border-brand-300 hover:shadow-sm"
      }`}
    >
      {/* Área informativa seleccionable (botón a ancho completo) */}
      <button
        type="button"
        onClick={() => onSelect(center.id)}
        className="block w-full cursor-pointer p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug text-foreground">
            {center.name}
          </h3>
          {distance && (
            <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground/70">
              a {distance}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={center.status} />
          {center.city && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/55">
              <span aria-hidden="true">🏙️</span>
              {center.city}
            </span>
          )}
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/75">
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            📍
          </span>
          {center.address}
        </p>

        <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground/75">
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            🕒
          </span>
          {center.schedule}
        </p>

        <div className="mt-3">
          <MaterialChips materials={center.materials} />
        </div>

        {/* Aviso de precaución para centros no verificados */}
        {!isVerified && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-accent-300 bg-accent-50 px-3 py-2 text-xs leading-relaxed text-accent-900">
            <span aria-hidden="true" className="mt-px shrink-0">
              ⚠️
            </span>
            <span>
              {center.notes?.trim()
                ? center.notes
                : STATUS_META[center.status].description}
            </span>
          </p>
        )}
      </button>

      {/* Atribución de fuente (fuera del botón para no anidar interactivos) */}
      {isOfficial ? (
        <p className="-mt-1 px-4 pb-3">
          <a
            href="https://acopiove.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/50 transition-colors hover:text-brand-700 hover:underline"
          >
            <span aria-hidden="true">🔗</span>
            Fuente: acopiove.org
          </a>
        </p>
      ) : isCommunity ? (
        <p className="-mt-1 px-4 pb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/50">
            <span aria-hidden="true">👥</span>
            Reporte comunitario
          </span>
        </p>
      ) : null}

      {/* Acciones: enlaces independientes con touch targets amplios */}
      <div className="flex border-t border-border">
        {center.phone ? (
          <a
            href={telHref(center.phone)}
            onClick={() => {
              track("llamar", { fuente: isOfficial ? "oficial" : "comunidad" });
              recordVisit(center.id, center.name);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <span aria-hidden="true">📞</span>
            Llamar
          </a>
        ) : (
          <span className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium text-foreground/40">
            <span aria-hidden="true">📞</span>
            Sin teléfono
          </span>
        )}
        <a
          href={directionsHref(center.lat, center.lng)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track("como_llegar", { fuente: isOfficial ? "oficial" : "comunidad" });
            recordVisit(center.id, center.name);
          }}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-border px-3 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <span aria-hidden="true">🧭</span>
          Cómo llegar
        </a>
      </div>
    </article>
  );
}
