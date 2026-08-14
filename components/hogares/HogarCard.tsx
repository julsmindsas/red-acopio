import Link from "next/link";
import {
  ACEPTA_LABELS,
  CONVIVENCIA_LABELS,
  DURACION_LABELS,
  OFRECE_LABELS,
  type HogarAcepta,
  type HogarPublico,
} from "@/lib/hogares/types";

/*
 * Tarjeta pública de un hogar de paso (Server Component, sin JS de cliente).
 *
 * PRINCIPIO INNEGOCIABLE: aquí solo entra `HogarPublico`, la proyección que
 * sale de `toHogarPublico()`. Nunca el nombre del anfitrión, ni su teléfono,
 * ni la dirección: la tarjeta describe la casa, no a la persona. El contacto
 * lo media el equipo coordinador después de la solicitud.
 *
 * Jerarquía de lectura pensada para alguien que lo perdió todo y navega desde
 * un celular prestado: 1) dónde está y para cuántos, 2) si acepta a "los míos"
 * (incluidas las mascotas), 3) quiénes viven allí (transparencia = seguridad),
 * 4) un solo botón de acción.
 */

/** Los valores de `acepta` que son animales: llevan huella para verse de un
 * vistazo — quien evacúa con su perro escanea la lista buscando ese icono. */
const ACEPTA_MASCOTAS: ReadonlySet<HogarAcepta> = new Set([
  "perros",
  "gatos",
  "otras_mascotas",
]);

export default function HogarCard({ hogar }: { hogar: HogarPublico }) {
  const ocupado = hogar.disponibilidad === "ocupado";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-brand-300 hover:shadow-sm">
      <div className="flex flex-1 flex-col p-4">
        {/* 1. DÓNDE + PARA CUÁNTOS — lo primero que decide si sigo leyendo. */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl"
          >
            🏠
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold leading-tight text-foreground">
              {hogar.ciudad}
              {hogar.zona ? ` · ${hogar.zona}` : ""}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-foreground/55">
              Hasta {hogar.capacidad}{" "}
              {hogar.capacidad === 1 ? "persona" : "personas"} ·{" "}
              {DURACION_LABELS[hogar.duracion]}
            </p>
          </div>
        </div>

        {/* Confianza y estado: verificado va siempre (la lista solo publica
            verificados) y la disponibilidad avisa si la casa ya está llena. */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
            <span aria-hidden="true">✓</span>
            Verificado por el equipo
          </span>
          {ocupado ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
              Ya está hospedando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              Disponible ahora
            </span>
          )}
        </div>

        {/* 2. A QUIÉNES RECIBE — chips; las mascotas llevan huella 🐾. */}
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Puede recibir">
          {hogar.acepta.map((a) => (
            <li
              key={a}
              className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
            >
              {ACEPTA_MASCOTAS.has(a) && <span aria-hidden="true">🐾</span>}
              {ACEPTA_LABELS[a]}
            </li>
          ))}
        </ul>

        {/* 3. QUIÉNES VIVEN EN LA CASA — la línea de transparencia. Se muestra
            como frase, no como badge: es información delicada y humana. Las
            etiquetas ya vienen como "Vive una mujer sola", así que solo se
            baja la inicial para que la frase fluya. */}
        <p className="mt-3 text-[13px] font-medium text-foreground/75">
          <span aria-hidden="true">👥</span> En esta casa:{" "}
          {CONVIVENCIA_LABELS[hogar.convivencia].charAt(0).toLowerCase() +
            CONVIVENCIA_LABELS[hogar.convivencia].slice(1)}
          .
        </p>

        {/* Qué ofrece además del techo (si declaró algo). */}
        {hogar.ofrece.length > 0 && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/65">
            <span className="font-semibold text-foreground/80">Ofrece:</span>{" "}
            {hogar.ofrece.map((o) => OFRECE_LABELS[o]).join(" · ")}
          </p>
        )}

        {/* Notas del anfitrión, ya revisadas por el equipo antes de publicar. */}
        {hogar.notas?.trim() && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-foreground/60">
            {hogar.notas}
          </p>
        )}
      </div>

      {/* 4. UNA SOLA ACCIÓN — abre la solicitud con este hogar preseleccionado.
          Nunca hay teléfono ni dirección aquí: el equipo hace el puente. */}
      <div className="px-4 pb-4">
        <Link
          href={`/hogares/solicitar?hogar=${hogar.id}`}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
        >
          <span aria-hidden="true">🏠</span>
          Solicitar este hogar
        </Link>
      </div>
    </article>
  );
}
