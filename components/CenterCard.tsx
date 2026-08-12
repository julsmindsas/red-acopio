"use client";

import { track } from "@vercel/analytics";
import {
  MATERIAL_LABELS,
  OPERATIONAL_META,
  POINT_KIND_META,
  STATUS_META,
} from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { CenterWithDistance } from "@/lib/types";
import CommunityReport from "./CommunityReport";
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
 * Enlace para compartir el punto por WhatsApp.
 *
 * En Colombia la información de una emergencia circula por WhatsApp, no por
 * enlaces a webs. Compartir un punto con su dirección y su mapa hace que llegue
 * a quien no tiene la app —o no tiene datos para abrirla.
 */
function whatsappHref(center: CenterWithDistance): string {
  const lines = [
    `${center.name}`,
    `📍 ${center.address}`,
    center.phone ? `📞 ${center.phone}` : null,
    `🗺️ ${directionsHref(center.lat, center.lng)}`,
    "",
    "Confirma antes de ir. Vía Red de Acopio.",
  ].filter(Boolean);

  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
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
  const kindMeta = POINT_KIND_META[center.kind];
  const opMeta = OPERATIONAL_META[center.operational];
  const urgentNeeds = center.urgentNeeds ?? [];
  const notReceiving = center.notReceiving ?? [];

  /**
   * Nombre sin el prefijo del tipo.
   *
   * Las fuentes nombran los puntos "Centro de acopio — Plazoleta Jairo Varela"
   * o "Albergue temporal — Coliseo Mayor". Con el tipo ya indicado por el icono
   * y la etiqueta, ese prefijo hacía que todas las tarjetas empezaran igual y
   * el nombre real quedara desplazado a la segunda línea.
   */
  const displayName = center.name.replace(
    /^(Centro de acopio|Albergue temporal|Albergue|Donación de sangre|Centro de Solidaridad)\s*[—–-]\s*/i,
    "",
  );

  /** Ubicación no exacta: se avisa con una etiqueta, no con un párrafo. */
  const isApproximate = /APROXIMADA/i.test(center.geoNote ?? "");

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
        {/* 1. QUÉ ES + A QUÉ DISTANCIA — el icono hace de ancla visual para
            poder barrer la lista sin leer. */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xl"
          >
            {kindMeta.emoji}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold leading-tight text-foreground">
              {displayName}
            </h3>
            {/* Una sola línea de contexto en vez de cuatro badges sueltos */}
            <p className="mt-0.5 text-xs font-medium text-foreground/55">
              {kindMeta.label}
              {center.city ? ` · ${center.city}` : ""}
              {distance ? ` · a ${distance}` : ""}
            </p>
          </div>
        </div>

        {/* 2. DIRECCIÓN — el dato por el que la persona abrió la tarjeta. */}
        <p className="mt-3 text-[15px] font-medium leading-snug text-foreground">
          {center.address}
        </p>
        {/* "Horario no publicado" no informa nada: se omite y la línea se ahorra. */}
        {!/no publicado/i.test(center.schedule) && (
          <p className="mt-0.5 text-[13px] text-foreground/60">
            {center.schedule}
          </p>
        )}

        {/* 3. ESTADO — solo lo que cambia una decisión: si está saturado o si
            el dato no está confirmado. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {center.operational !== "desconocido" && (
            <span
              title={opMeta.description}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${opMeta.badgeClass}`}
            >
              <span aria-hidden="true">{opMeta.emoji}</span>
              {opMeta.label}
            </span>
          )}
          <StatusBadge status={center.status} />
          {isApproximate && (
            <span
              title={center.geoNote ?? undefined}
              className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground/60"
            >
              <span aria-hidden="true">📍</span>
              Ubicación aproximada
            </span>
          )}
        </div>

        {center.materials.length > 0 && (
          <div className="mt-2.5">
            <MaterialChips materials={center.materials} max={3} />
          </div>
        )}

        {/* Lo que más falta ahora: dirige las donaciones a donde hacen falta */}
        {urgentNeeds.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-900">
            <span aria-hidden="true">🔺</span>
            <span className="font-bold">Urge:</span>
            {urgentNeeds.map((m) => MATERIAL_LABELS[m]).join(", ")}
          </p>
        )}

        {/* Lo que pidieron NO seguir llevando: evita saturar más el punto */}
        {notReceiving.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900">
            <span aria-hidden="true">🚫</span>
            <span className="font-bold">No llevar:</span>
            {notReceiving.map((m) => MATERIAL_LABELS[m]).join(", ")}
          </p>
        )}

        {/* Saturación: el aviso que evita el colapso logístico */}
        {center.operational === "lleno" && (
          <p className="mt-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-medium leading-relaxed text-orange-900">
            Este punto reportó estar <strong>saturado</strong>. Busca otro
            cercano antes de llevar donaciones.
          </p>
        )}

        {/* 4. NOTA — solo si aporta algo que no está ya arriba. Se recorta a
            dos líneas: el detalle completo vive en la ficha de la fuente. */}
        {center.notes?.trim() && (
          <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-foreground/65">
            {center.notes}
          </p>
        )}

        {/* El aviso de "sin verificar" NO se repite aquí: la insignia de arriba
            ya lo dice y su tooltip lo explica. Repetirlo en 54 de 57 tarjetas
            lo convertía en ruido de fondo, que es justo cómo se pierde una
            advertencia importante. */}
      </button>

      {/* ACCIONES — una principal, dos de apoyo.
          "Cómo llegar" es lo que casi todo el mundo necesita: va sólida y
          ocupa el ancho. Llamar y compartir quedan como iconos, y el botón
          muerto de "Sin teléfono" desaparece cuando no hay número. */}
      <div className="flex items-stretch gap-2 px-4 pb-4">
        <a
          href={directionsHref(center.lat, center.lng)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track("como_llegar", { fuente: isOfficial ? "oficial" : "comunidad" });
            recordVisit(center.id, center.name);
          }}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
        >
          <span aria-hidden="true">🧭</span>
          Cómo llegar
        </a>

        {center.phone && (
          <a
            href={telHref(center.phone)}
            onClick={() => {
              track("llamar", { fuente: isOfficial ? "oficial" : "comunidad" });
              recordVisit(center.id, center.name);
            }}
            aria-label={`Llamar a ${displayName}`}
            title={`Llamar: ${center.phone}`}
            className="flex min-h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-lg transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            <span aria-hidden="true">📞</span>
          </a>
        )}

        <a
          href={whatsappHref(center)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("compartir_whatsapp")}
          aria-label={`Compartir ${displayName} por WhatsApp`}
          title="Compartir por WhatsApp"
          className="flex min-h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-lg transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <span aria-hidden="true">💬</span>
        </a>
      </div>

      {/* Reporte comunitario: mantiene vivo el dato que más rápido caduca */}
      <CommunityReport
        centerId={center.id}
        centerName={center.name}
        community={center.community}
      />
    </article>
  );
}
