"use client";

import { useMemo, useState } from "react";
import type { Hogar, SolicitudHogar } from "@/lib/hogares/types";
import { CONVIVENCIA_LABELS, DURACION_LABELS } from "@/lib/hogares/types";
import {
  hogaresCompatibles,
  razonesIncompatibilidad,
} from "@/lib/hogares/match";
import type { Result } from "../api";
import { Banner, Spinner } from "../ui";
import ModalShell from "./ModalShell";
import { TelefonoLink } from "./meta";

/**
 * Normaliza para comparar ciudades igual que `lib/hogares/match.ts` (que ya
 * ordena por ciudad pero no exporta el comparador): sin tildes ni mayúsculas.
 */
function normalizarCiudad(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/*
 * Modal de emparejamiento de una solicitud con un hogar.
 * ------------------------------------------------------------------------
 * Dos fases:
 *  1. "elegir": lista de hogares compatibles según `hogaresCompatibles`
 *     (misma ciudad primero; se etiqueta cuando el hogar es de otra ciudad,
 *     porque mudarse de ciudad es una decisión que la familia debe aceptar).
 *     Los descartados quedan en un desplegable con sus razones: el equipo
 *     merece ver el porqué, no un filtro opaco.
 *  2. "resultado": tras el PATCH exitoso, el código de verificación EN GRANDE.
 *     Es el momento crítico del flujo: si el equipo no dicta el código a
 *     ambas partes, el control anti-suplantación no existe.
 */
export default function EmparejarModal({
  solicitud,
  hogares,
  onClose,
  onEmparejar,
}: {
  solicitud: SolicitudHogar;
  hogares: Hogar[];
  onClose: () => void;
  /** Hace el PATCH { estado: "emparejada", hogarId } y devuelve el resultado. */
  onEmparejar: (hogarId: string) => Promise<Result<SolicitudHogar>>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Solicitud ya emparejada (fase resultado), con el código del servidor. */
  const [resultado, setResultado] = useState<SolicitudHogar | null>(null);

  const compatibles = useMemo(
    () => hogaresCompatibles(hogares, solicitud),
    [hogares, solicitud],
  );

  // Descartados con sus razones. Los rechazados en verificación se omiten:
  // nunca serán opción y solo agregarían ruido a la lista.
  const descartados = useMemo(
    () =>
      hogares
        .filter(
          (h) =>
            h.verificacion !== "rechazado" &&
            !compatibles.some((c) => c.id === h.id),
        )
        .map((h) => ({ hogar: h, razones: razonesIncompatibilidad(h, solicitud) })),
    [hogares, compatibles, solicitud],
  );

  const elegir = async (hogarId: string) => {
    if (busyId) return;
    setBusyId(hogarId);
    setError(null);
    const res = await onEmparejar(hogarId);
    setBusyId(null);
    if (res.ok) {
      setResultado(res.data);
    } else {
      setError(res.error);
    }
  };

  const hogarElegido = resultado?.hogarId
    ? (hogares.find((h) => h.id === resultado.hogarId) ?? null)
    : null;

  return (
    <ModalShell
      title={
        resultado
          ? "¡Emparejada! Dicta el código"
          : `Buscar hogar para ${solicitud.nombre}`
      }
      onClose={onClose}
      busy={busyId !== null}
    >
      {resultado ? (
        /* ---- Fase 2: resultado con el código en grande ---- */
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="rounded-2xl border border-brand-300 bg-brand-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-900/70">
              Código de verificación
            </p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.35em] text-brand-900">
              {resultado.codigoVerificacion ?? "—"}
            </p>
          </div>
          <Banner tone="info">
            Dicta este código por teléfono a <strong>ambas partes</strong>: a{" "}
            {solicitud.nombre} y al hogar
            {hogarElegido ? ` de ${hogarElegido.nombre}` : ""}. Al llegar lo
            comparan y, si no coincide, nadie entra. Es la barrera contra
            suplantaciones.
          </Banner>
          {hogarElegido && (
            <p className="text-sm text-foreground/75">
              Hogar asignado: <strong>{hogarElegido.nombre}</strong> (
              <TelefonoLink telefono={hogarElegido.telefono} />) ·{" "}
              {hogarElegido.ciudad}
              {hogarElegido.zona ? `, ${hogarElegido.zona}` : ""}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            Entendido, ya lo anoté
          </button>
        </div>
      ) : (
        /* ---- Fase 1: elegir hogar compatible ---- */
        <div className="flex flex-col gap-4 px-5 py-4">
          {error && <Banner tone="error">{error}</Banner>}

          <p className="text-sm text-foreground/70">
            Grupo de {solicitud.personas}{" "}
            {solicitud.personas === 1 ? "persona" : "personas"} en{" "}
            <strong>{solicitud.ciudad}</strong>. Solo se listan hogares que
            respetan la composición y las preferencias declaradas.
          </p>

          {compatibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
              <span aria-hidden="true" className="block text-2xl">
                🏚️
              </span>
              <p className="mt-1">
                Ningún hogar verificado y disponible es compatible con esta
                solicitud por ahora.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {compatibles.map((h) => {
                const otraCiudad =
                  normalizarCiudad(h.ciudad) !==
                  normalizarCiudad(solicitud.ciudad);
                return (
                  <li
                    key={h.id}
                    className="rounded-2xl border border-border bg-surface p-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {h.nombre}
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/70">
                          {h.ciudad}
                          {h.zona ? ` · ${h.zona}` : ""} · caben {h.capacidad} ·{" "}
                          {DURACION_LABELS[h.duracion]}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/55">
                          {CONVIVENCIA_LABELS[h.convivencia]}
                        </p>
                      </div>
                      {otraCiudad && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-900">
                          🚌 Otra ciudad
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void elegir(h.id)}
                      disabled={busyId !== null}
                      className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === h.id ? (
                        <>
                          <Spinner className="size-4 text-white" />
                          Emparejando…
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true">🤝</span>
                          Emparejar aquí
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Descartados con el porqué, para no esconder decisiones */}
          {descartados.length > 0 && (
            <details className="rounded-2xl border border-border bg-surface-muted/40 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground/70">
                {descartados.length}{" "}
                {descartados.length === 1
                  ? "hogar descartado — ver por qué"
                  : "hogares descartados — ver por qué"}
              </summary>
              <ul className="mt-2.5 flex flex-col gap-2">
                {descartados.map(({ hogar, razones }) => (
                  <li
                    key={hogar.id}
                    className="rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm"
                  >
                    <p className="font-semibold text-foreground/80">
                      {hogar.nombre} · {hogar.ciudad}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-foreground/60">
                      {razones.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </ModalShell>
  );
}
