"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { OPERATIONAL_META } from "@/lib/constants";
import type { CommunityStatus, OperationalStatus } from "@/lib/types";

/*
 * Reporte comunitario en un toque.
 * -------------------------------------------------------------------------
 * El dato más valioso de una emergencia —¿sigue abierto? ¿está lleno?— es el
 * que más rápido caduca, y ninguna redacción alcanza a mantenerlo al día para
 * decenas de puntos. Quien acaba de pasar por ahí sí lo sabe.
 *
 * Por eso: tres botones, sin registro, sin formulario, sin datos personales.
 * Dos segundos. Es la lección del mapa de Ushahidi en Haití, donde la
 * información útil llegó de la gente en el terreno.
 */

/** Cómo se le pregunta a alguien que estuvo allí, en su idioma. */
const OPTIONS: { status: OperationalStatus; label: string; emoji: string }[] = [
  { status: "recibiendo", label: "Sigue abierto", emoji: "🟢" },
  { status: "lleno", label: "Está lleno", emoji: "🟠" },
  { status: "cerrado", label: "Ya cerró", emoji: "🔴" },
];

/** "hace 25 min", "hace 3 h" — sin librerías de fechas. */
function timeAgo(iso: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} h`;
}

export default function CommunityReport({
  centerId,
  centerName,
  community,
}: {
  centerId: string;
  centerName: string;
  community?: CommunityStatus;
}) {
  const [sent, setSent] = useState<OperationalStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /**
   * Los botones arrancan plegados.
   *
   * Repetir tres botones en cada una de las 57 tarjetas convertía la lista en
   * un muro de controles y enterraba lo que la gente vino a leer. Plegado, el
   * aporte sigue a un toque de distancia para quien acaba de estar allí.
   */
  const [open, setOpen] = useState(false);

  const report = async (status: OperationalStatus) => {
    if (sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/centers/${centerId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setSent(status);
        track("reporte_comunitario", { estado: status });
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      // El 429 no es un fallo del usuario: ya ayudó hace poco.
      if (res.status === 429) setSent(status);
      else setError(data?.error ?? "No se pudo enviar tu reporte.");
    } catch {
      setError("Sin conexión. Inténtalo cuando vuelva la señal.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border px-4 py-3">
      {/* Lo que ya reportó la comunidad */}
      {community && (
        <p
          className={`mb-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
            OPERATIONAL_META[community.status].badgeClass
          }`}
        >
          <span aria-hidden="true">
            {OPERATIONAL_META[community.status].emoji}
          </span>
          {community.count === 1
            ? "1 persona reportó"
            : `${community.count} personas reportaron`}
          : {OPERATIONAL_META[community.status].label.toLowerCase()} ·{" "}
          {timeAgo(community.lastReportAt)}
        </p>
      )}

      {sent ? (
        <p className="text-xs font-medium text-emerald-700">
          ✓ Gracias. Tu reporte ayuda a quien busque este punto ahora.
        </p>
      ) : open ? (
        <>
          <p className="mb-2 text-xs font-semibold text-foreground/70">
            ¿Cómo lo encontraste?
          </p>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.status}
                type="button"
                disabled={sending}
                onClick={() => report(opt.status)}
                aria-label={`Reportar que ${centerName} ${opt.label.toLowerCase()}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground/80 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
              >
                <span aria-hidden="true">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          ¿Estuviste aquí? Cuéntanos cómo está →
        </button>
      )}
    </div>
  );
}
