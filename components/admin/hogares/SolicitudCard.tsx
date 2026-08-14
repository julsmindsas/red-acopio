"use client";

import { useState } from "react";
import type { Hogar, SolicitudHogar } from "@/lib/hogares/types";
import { ACEPTA_LABELS, CONVIVENCIA_LABELS } from "@/lib/hogares/types";
import { seguimientoPendiente } from "@/lib/hogares/match";
import { Spinner } from "../ui";
import {
  Dato,
  ESTADO_META,
  EstadoBadge,
  HITO_LABELS,
  TelefonoLink,
  fmtFecha,
} from "./meta";

/*
 * Tarjeta de una solicitud de hospedaje.
 * ------------------------------------------------------------------------
 * Muestra los datos privados (este panel es del equipo) y las acciones que
 * corresponden al estado dentro del ciclo operativo:
 *
 *   nueva / en_proceso -> "Buscar hogar" (abre el modal de emparejamiento)
 *   emparejada         -> código de verificación + hogar asignado + "Ya llegó"
 *   hospedada          -> historial de llamadas + "Registrar llamada"
 *   (no cerrada)       -> "Cerrar" con confirmación (libera el hogar)
 *
 * Si alguna llamada de seguimiento reportó `bien === false`, toda la tarjeta
 * pasa a tono de alerta: es un caso que exige atención inmediata del equipo.
 */
export default function SolicitudCard({
  solicitud,
  hogares,
  busy,
  onBuscarHogar,
  onYaLlego,
  onRegistrarLlamada,
  onCerrar,
}: {
  solicitud: SolicitudHogar;
  /** Todos los hogares, para resolver el hogar asignado por `hogarId`. */
  hogares: Hogar[];
  busy: boolean;
  onBuscarHogar: (solicitud: SolicitudHogar) => void;
  onYaLlego: (id: string) => void;
  onRegistrarLlamada: (
    solicitud: SolicitudHogar,
    hito: "48h" | "7d" | "otro",
  ) => void;
  onCerrar: (id: string) => void;
}) {
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  const meta = ESTADO_META[solicitud.estado];
  const hogarAsignado = solicitud.hogarId
    ? (hogares.find((h) => h.id === solicitud.hogarId) ?? null)
    : null;
  // Alguien reportó no estar bien: la tarjeta entera cambia a tono de alerta.
  const enAlerta = solicitud.seguimientos.some((s) => !s.bien);
  // El hito que toca hoy (o null); precalcula el modal de "Registrar llamada".
  const hitoPendiente = seguimientoPendiente(solicitud);

  return (
    <li
      className={`rounded-2xl border p-4 ${
        enAlerta
          ? "border-red-300 bg-red-50/70"
          : "border-border bg-surface"
      }`}
    >
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-base font-bold tracking-tight text-foreground">
            {solicitud.nombre}
          </h4>
          <p className="mt-0.5 text-sm text-foreground/70">
            <TelefonoLink telefono={solicitud.telefono} /> · {solicitud.ciudad}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {enAlerta && (
            <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
              ⚠️ Atención
            </span>
          )}
          <EstadoBadge label={meta.label} badge={meta.badge} />
        </div>
      </div>

      {/* Composición y preferencias */}
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <Dato term="Grupo">
          {solicitud.personas}{" "}
          {solicitud.personas === 1 ? "persona" : "personas"} ·{" "}
          {solicitud.composicion.map((c) => ACEPTA_LABELS[c]).join(", ")}
        </Dato>
        <Dato term="Se sentiría segura con">
          {solicitud.preferencias.length > 0 ? (
            solicitud.preferencias
              .map((p) => CONVIVENCIA_LABELS[p])
              .join("; ")
          ) : (
            <span className="text-foreground/40">Sin preferencia declarada</span>
          )}
        </Dato>
        {solicitud.notas && (
          <Dato term="Notas" wide>
            {solicitud.notas}
          </Dato>
        )}
        <Dato term="Recibida">{fmtFecha(solicitud.createdAt)}</Dato>
        {solicitud.hospedadaAt && (
          <Dato term="Llegó al hogar">{fmtFecha(solicitud.hospedadaAt)}</Dato>
        )}
      </dl>

      {/* Emparejada: código + hogar asignado. El código se dicta por teléfono
          a ambas partes; al llegar lo comparan y si no coincide, nadie entra. */}
      {solicitud.estado === "emparejada" && solicitud.codigoVerificacion && (
        <div className="mt-3 rounded-xl border border-brand-300 bg-brand-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-900/70">
            Código de verificación (dictar a ambas partes)
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-brand-900">
            {solicitud.codigoVerificacion}
          </p>
          {hogarAsignado && (
            <p className="mt-1.5 text-sm text-brand-900/80">
              Hogar asignado: <strong>{hogarAsignado.nombre}</strong> (
              <TelefonoLink telefono={hogarAsignado.telefono} />) ·{" "}
              {hogarAsignado.ciudad}
              {hogarAsignado.zona ? `, ${hogarAsignado.zona}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Hospedada: historial de llamadas de seguimiento */}
      {solicitud.estado === "hospedada" && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Seguimientos
          </p>
          {solicitud.seguimientos.length === 0 ? (
            <p className="mt-1 text-sm text-foreground/55">
              Aún no se ha registrado ninguna llamada.
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {solicitud.seguimientos.map((s, i) => (
                <li
                  key={`${s.hito}-${s.fecha}-${i}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    s.bien
                      ? "border-border bg-surface-muted/40 text-foreground/80"
                      : "border-red-300 bg-red-50 text-red-900"
                  }`}
                >
                  <span className="font-semibold">
                    {s.bien ? "✅" : "🚨"} {HITO_LABELS[s.hito]}
                  </span>{" "}
                  <span className="text-foreground/55">
                    · {fmtFecha(s.fecha)}
                  </span>
                  {s.nota && <p className="mt-0.5">{s.nota}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Acciones según el estado */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        {(solicitud.estado === "nueva" || solicitud.estado === "en_proceso") && (
          <button
            type="button"
            onClick={() => onBuscarHogar(solicitud)}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <span aria-hidden="true">🔍</span>
            )}
            Buscar hogar
          </button>
        )}

        {solicitud.estado === "emparejada" && (
          <button
            type="button"
            onClick={() => onYaLlego(solicitud.id)}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <span aria-hidden="true">🏡</span>
            )}
            Ya llegó
          </button>
        )}

        {solicitud.estado === "hospedada" && (
          <button
            type="button"
            onClick={() =>
              // Si toca un hito (48h/7d) el modal lo trae precalculado;
              // si no, la llamada se registra como "otro".
              onRegistrarLlamada(solicitud, hitoPendiente ?? "otro")
            }
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <span aria-hidden="true">📞</span>
            )}
            Registrar llamada
          </button>
        )}

        {/* Cerrar (cualquier estado no cerrado) con confirmación inline */}
        {solicitud.estado !== "cerrada" &&
          (confirmandoCierre ? (
            <span
              className="inline-flex flex-wrap items-center gap-2"
              role="group"
              aria-label={`Confirmar cierre de la solicitud de ${solicitud.nombre}`}
            >
              <span className="text-xs font-medium text-foreground/70">
                {solicitud.hogarId
                  ? "¿Cerrar? El hogar quedará libre para otra familia."
                  : "¿Cerrar esta solicitud?"}
              </span>
              <button
                type="button"
                onClick={() => onCerrar(solicitud.id)}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? <Spinner className="size-4 text-white" /> : null}
                Sí, cerrar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoCierre(false)}
                disabled={busy}
                className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoCierre(true)}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              <span aria-hidden="true">✔️</span>
              Cerrar
            </button>
          ))}
      </div>
    </li>
  );
}
