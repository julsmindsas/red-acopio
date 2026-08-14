"use client";

import { useState } from "react";

/*
 * Botones de acción de la página /hogares/respuesta (enlace del correo).
 *
 * El GET solo muestra; TODA mutación pasa por este POST con el token: así un
 * escáner de correo que pre-visite el enlace no acepta solicitudes solo.
 */

interface Resultado {
  resultado?: string;
  codigo?: string;
  contacto?: { nombre: string; telefono: string };
  solicitanteNotificado?: boolean;
  disponibilidad?: string;
  error?: string;
  razones?: string[];
}

export default function RespuestaAcciones({
  token,
  modo,
  disponibilidadInicial,
}: {
  token: string;
  /** "responder" muestra aceptar/rechazar; "hogar" muestra pausar/reactivar. */
  modo: "responder" | "hogar";
  disponibilidadInicial?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const ejecutar = async (accion: string) => {
    setBusy(accion);
    try {
      const res = await fetch("/api/hogares/respuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accion }),
      });
      setResultado((await res.json()) as Resultado);
    } catch {
      setResultado({
        error: "Problema de conexión. Revisa tu internet e inténtalo de nuevo.",
      });
    } finally {
      setBusy(null);
    }
  };

  // ---- Estados finales ----------------------------------------------------
  if (resultado?.resultado === "aceptada") {
    return (
      <div className="rounded-2xl border border-brand-300 bg-brand-500/10 p-6 text-center">
        <span aria-hidden="true" className="text-4xl">🤝</span>
        <h2 className="mt-2 text-xl font-bold text-foreground">
          ¡Gracias! Quedaron conectados
        </h2>
        <p className="mt-2 text-sm text-foreground/75">
          El código de confirmación de ambas partes es:
        </p>
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-brand-600 py-3 text-center text-3xl font-extrabold tracking-[0.3em] text-white">
          {resultado.codigo}
        </p>
        <div className="mx-auto mt-4 max-w-sm rounded-xl border border-border bg-surface p-4 text-left text-sm">
          <p className="font-bold text-foreground">Contacto de quien llega:</p>
          <p className="mt-1 text-foreground/80">{resultado.contacto?.nombre}</p>
          <a
            href={`tel:${resultado.contacto?.telefono}`}
            className="mt-0.5 block font-semibold text-brand-700 underline underline-offset-2"
          >
            {resultado.contacto?.telefono}
          </a>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-foreground/60">
          {resultado.solicitanteNotificado
            ? "La persona ya recibió tu teléfono y el mismo código por correo. Llámense para acordar la llegada."
            : "La persona no dejó correo: llámala tú para acordar la llegada y dictarle el código."}{" "}
          Al llegar, comparen códigos: si no coincide, no abras la puerta.
        </p>
      </div>
    );
  }

  if (resultado?.resultado === "rechazada") {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
        <span aria-hidden="true" className="text-3xl">🕊️</span>
        <h2 className="mt-2 text-lg font-bold text-foreground">Listo, sin problema</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
          La solicitud sigue abierta para otros hogares y a nadie se le
          compartió tu información. Gracias por responder: eso también ayuda.
        </p>
      </div>
    );
  }

  if (resultado?.resultado === "pausar" || resultado?.resultado === "reactivar") {
    const pausado = resultado.resultado === "pausar";
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
        <span aria-hidden="true" className="text-3xl">{pausado ? "😴" : "🌤️"}</span>
        <h2 className="mt-2 text-lg font-bold text-foreground">
          {pausado ? "Tu hogar quedó en pausa" : "Tu hogar vuelve a estar disponible"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
          {pausado
            ? "Ya no aparece en la lista pública ni recibirás solicitudes. Reactívalo cuando quieras desde este mismo enlace."
            : "Ya aparece de nuevo en la lista pública. Gracias por seguir abriendo tu casa."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {resultado?.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {resultado.error}
          {resultado.razones && resultado.razones.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {resultado.razones.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modo === "responder" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void ejecutar("aceptar")}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {busy === "aceptar" ? "Confirmando…" : "✓ Puedo recibirlos"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void ejecutar("rechazar")}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            {busy === "rechazar" ? "Enviando…" : "No puedo en este momento"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {disponibilidadInicial === "pausado" ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void ejecutar("reactivar")}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {busy === "reactivar" ? "Reactivando…" : "🌤️ Reactivar mi hogar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void ejecutar("pausar")}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              {busy === "pausar" ? "Pausando…" : "😴 Pausar mi hogar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
