"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Hogar,
  HogarPatch,
  HogarVerificacion,
  Seguimiento,
  SolicitudHogar,
  SolicitudPatch,
} from "@/lib/hogares/types";
import { HOGAR_VERIFICACIONES } from "@/lib/hogares/types";
import { seguimientoPendiente } from "@/lib/hogares/match";
import {
  deleteHogar,
  getHogares,
  getSolicitudesHogar,
  patchHogar,
  patchSolicitudHogar,
  type Result,
} from "../api";
import { Banner, Spinner } from "../ui";
import HogarAdminCard from "./HogarAdminCard";
import SolicitudCard from "./SolicitudCard";
import EmparejarModal from "./EmparejarModal";
import SeguimientoModal from "./SeguimientoModal";
import {
  DISPONIBILIDAD_META,
  ESTADO_META,
  ESTADO_ORDEN,
  EstadoBadge,
  HITO_LABELS,
  VERIFICACION_META,
} from "./meta";

/*
 * Panel de Hogares de Paso (autenticado).
 * ------------------------------------------------------------------------
 * Espejo del <Dashboard/> de centros pero para el ciclo de hospedaje:
 * carga hogares y solicitudes juntos, centraliza todas las acciones y
 * recarga tras cada una para reflejar el estado real del servidor (que es
 * quien genera códigos, sella fechas y libera hogares).
 *
 * Las secciones siguen el orden operativo del día del equipo:
 *  a. Resumen de un vistazo.
 *  b. Seguimientos que tocan HOY (la deuda del día, arriba de todo).
 *  c. Hogares por verificar (sin verificación no hay oferta).
 *  d. Solicitudes por estado (nueva/en_proceso exigen acción primero).
 *  e. Todos los hogares (mantenimiento: pausar, reactivar, verificación).
 *
 * Un 401 en cualquier llamada devuelve al login vía `onSessionLost`.
 */
export default function HogaresPanel({
  onSessionLost,
}: {
  onSessionLost: () => void;
}) {
  const [hogares, setHogares] = useState<Hogar[] | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudHogar[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  /** Id (hogar o solicitud) con una acción en curso. */
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Solicitud en el modal de emparejamiento. */
  const [emparejando, setEmparejando] = useState<SolicitudHogar | null>(null);
  /** Solicitud + hito en el modal de seguimiento. */
  const [llamando, setLlamando] = useState<{
    solicitud: SolicitudHogar;
    hito: "48h" | "7d" | "otro";
  } | null>(null);

  // --- Carga de datos ------------------------------------------------------
  // Sin setState síncrono antes del `await`: este callback se invoca desde el
  // efecto de montaje y la regla react-hooks/set-state-in-effect lo veta.
  // `loading` ya nace en `true`, así que el spinner inicial no lo necesita.
  const reload = useCallback(async () => {
    const [resHogares, resSolicitudes] = await Promise.all([
      getHogares(),
      getSolicitudesHogar(),
    ]);
    setLoading(false);
    const fallo = !resHogares.ok ? resHogares : !resSolicitudes.ok ? resSolicitudes : null;
    if (fallo) {
      if (fallo.status === 401) {
        onSessionLost();
        return;
      }
      setLoadError(fallo.error);
      return;
    }
    setLoadError(null);
    if (resHogares.ok) setHogares(resHogares.data);
    if (resSolicitudes.ok) setSolicitudes(resSolicitudes.data);
  }, [onSessionLost]);

  // Disparo diferido de la carga inicial: la regla
  // react-hooks/set-state-in-effect veta invocar directamente en el efecto
  // una función que hace setState; dentro del callback del timer sí es válido.
  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  // El aviso de éxito se autodescarta a los 4s; los errores permanecen.
  useEffect(() => {
    if (flash?.tone !== "success") return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  // --- Acciones de red -----------------------------------------------------

  /** PATCH de hogar + recarga; el aviso lo decide quien invoca. */
  const runHogarPatch = useCallback(
    async (id: string, patch: HogarPatch): Promise<Result<Hogar>> => {
      setBusyId(id);
      const res = await patchHogar(id, patch);
      setBusyId(null);
      if (res.ok) {
        await reload();
      } else if (res.status === 401) {
        onSessionLost();
      }
      return res;
    },
    [reload, onSessionLost],
  );

  /** PATCH de solicitud + recarga; devuelve el resultado para los modales. */
  const runSolicitudPatch = useCallback(
    async (
      id: string,
      patch: SolicitudPatch,
    ): Promise<Result<SolicitudHogar>> => {
      setBusyId(id);
      const res = await patchSolicitudHogar(id, patch);
      setBusyId(null);
      if (res.ok) {
        await reload();
      } else if (res.status === 401) {
        onSessionLost();
      }
      return res;
    },
    [reload, onSessionLost],
  );

  const verificarHogar = useCallback(
    async (id: string) => {
      const res = await runHogarPatch(id, { verificacion: "verificado" });
      setFlash(
        res.ok
          ? {
              tone: "success",
              text: "Hogar verificado. Ya puede recibir emparejamientos.",
            }
          : { tone: "error", text: res.error },
      );
    },
    [runHogarPatch],
  );

  const rechazarHogar = useCallback(
    async (id: string) => {
      const res = await runHogarPatch(id, { verificacion: "rechazado" });
      setFlash(
        res.ok
          ? { tone: "success", text: "Hogar rechazado. No se publicará." }
          : { tone: "error", text: res.error },
      );
    },
    [runHogarPatch],
  );

  const cambiarVerificacion = useCallback(
    async (id: string, verificacion: HogarVerificacion) => {
      const res = await runHogarPatch(id, { verificacion });
      setFlash(
        res.ok
          ? {
              tone: "success",
              text: `Verificación actualizada a "${VERIFICACION_META[verificacion].label}".`,
            }
          : { tone: "error", text: res.error },
      );
    },
    [runHogarPatch],
  );

  const cambiarDisponibilidad = useCallback(
    async (id: string, disponibilidad: "disponible" | "pausado") => {
      const res = await runHogarPatch(id, { disponibilidad });
      setFlash(
        res.ok
          ? {
              tone: "success",
              text:
                disponibilidad === "pausado"
                  ? "Hogar en pausa: no aparecerá como opción."
                  : "Hogar reactivado y disponible.",
            }
          : { tone: "error", text: res.error },
      );
    },
    [runHogarPatch],
  );

  const eliminarHogar = useCallback(
    async (id: string) => {
      setBusyId(id);
      const res = await deleteHogar(id);
      setBusyId(null);
      if (res.ok) {
        setFlash({ tone: "success", text: "Hogar eliminado." });
        await reload();
      } else if (res.status === 401) {
        onSessionLost();
      } else {
        setFlash({ tone: "error", text: res.error });
      }
    },
    [reload, onSessionLost],
  );

  /** Emparejar desde el modal: el servidor genera el código y ocupa el hogar. */
  const emparejar = useCallback(
    async (hogarId: string): Promise<Result<SolicitudHogar>> => {
      if (!emparejando) {
        return { ok: false, status: 0, error: "No hay solicitud seleccionada." };
      }
      const res = await runSolicitudPatch(emparejando.id, {
        estado: "emparejada",
        hogarId,
      });
      // El modal se queda abierto mostrando el código; el aviso llega igual
      // para que quede constancia al cerrar.
      if (res.ok) {
        setFlash({
          tone: "success",
          text: "Solicitud emparejada. Dicta el código a ambas partes.",
        });
      }
      return res;
    },
    [emparejando, runSolicitudPatch],
  );

  const yaLlego = useCallback(
    async (id: string) => {
      const res = await runSolicitudPatch(id, { estado: "hospedada" });
      setFlash(
        res.ok
          ? {
              tone: "success",
              text: "Registrado: la persona ya llegó. El seguimiento de 48h aparecerá aquí cuando toque.",
            }
          : { tone: "error", text: res.error },
      );
    },
    [runSolicitudPatch],
  );

  const cerrarSolicitud = useCallback(
    async (id: string) => {
      const teniaHogar = (solicitudes ?? []).find((s) => s.id === id)?.hogarId;
      const res = await runSolicitudPatch(id, { estado: "cerrada" });
      setFlash(
        res.ok
          ? {
              tone: "success",
              text: teniaHogar
                ? "Solicitud cerrada. El hogar quedó libre para otra familia."
                : "Solicitud cerrada.",
            }
          : { tone: "error", text: res.error },
      );
    },
    [runSolicitudPatch, solicitudes],
  );

  /** Guardar una llamada de seguimiento (lista completa: previos + nueva). */
  const guardarSeguimiento = useCallback(
    async (seguimientos: Seguimiento[]): Promise<Result<SolicitudHogar>> => {
      if (!llamando) {
        return { ok: false, status: 0, error: "No hay solicitud seleccionada." };
      }
      const res = await runSolicitudPatch(llamando.solicitud.id, {
        seguimientos,
      });
      if (res.ok) {
        setLlamando(null);
        const ultima = seguimientos[seguimientos.length - 1];
        setFlash(
          ultima && !ultima.bien
            ? {
                tone: "error",
                text: "Llamada registrada con ALERTA: revisa la solicitud resaltada.",
              }
            : { tone: "success", text: "Llamada de seguimiento registrada." },
        );
      }
      return res;
    },
    [llamando, runSolicitudPatch],
  );

  // --- Derivados -----------------------------------------------------------
  const listaHogares = useMemo(() => hogares ?? [], [hogares]);
  const listaSolicitudes = useMemo(() => solicitudes ?? [], [solicitudes]);

  const porVerificar = useMemo(
    () => listaHogares.filter((h) => h.verificacion === "pendiente"),
    [listaHogares],
  );

  /** Hospedadas cuyo hito de 48h o 7d ya venció: la deuda del día. */
  const conSeguimientoPendiente = useMemo(
    () =>
      listaSolicitudes
        .map((s) => ({ solicitud: s, hito: seguimientoPendiente(s) }))
        .filter(
          (x): x is { solicitud: SolicitudHogar; hito: "48h" | "7d" } =>
            x.hito !== null,
        ),
    [listaSolicitudes],
  );

  const counts = useMemo(
    () => ({
      porVerificar: porVerificar.length,
      disponibles: listaHogares.filter(
        (h) =>
          h.verificacion === "verificado" && h.disponibilidad === "disponible",
      ).length,
      nuevas: listaSolicitudes.filter((s) => s.estado === "nueva").length,
      seguimientosHoy: conSeguimientoPendiente.length,
    }),
    [porVerificar, listaHogares, listaSolicitudes, conSeguimientoPendiente],
  );

  /**
   * Solicitudes agrupadas por estado en orden operativo. Las que ya están en
   * la sección de seguimientos pendientes se excluyen para no duplicarlas.
   */
  const grupos = useMemo(() => {
    const pendientesIds = new Set(
      conSeguimientoPendiente.map((x) => x.solicitud.id),
    );
    return ESTADO_ORDEN.map((estado) => ({
      estado,
      items: listaSolicitudes.filter(
        (s) => s.estado === estado && !pendientesIds.has(s.id),
      ),
    })).filter((g) => g.items.length > 0);
  }, [listaSolicitudes, conSeguimientoPendiente]);

  // --- Render --------------------------------------------------------------

  // Carga inicial (aún sin datos).
  if (loading && hogares === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-foreground/60">
        <Spinner className="size-7 text-brand-600" />
        <p className="text-sm">Cargando hogares de paso…</p>
      </div>
    );
  }

  // Fallo de carga inicial.
  if (loadError && hogares === null) {
    return (
      <div className="py-10">
        <Banner tone="error">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => {
              // Reintento manual: aquí sí volvemos al spinner (es un evento,
              // no un efecto).
              setLoading(true);
              void reload();
            }}
            className="font-semibold underline underline-offset-2"
          >
            Reintentar
          </button>
        </Banner>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso flotante de la última acción */}
      {flash && (
        <Banner tone={flash.tone} onDismiss={() => setFlash(null)}>
          {flash.text}
        </Banner>
      )}

      {/* Aviso de error de recarga (cuando ya teníamos datos) */}
      {loadError && hogares !== null && (
        <Banner tone="error" onDismiss={() => setLoadError(null)}>
          {loadError}
        </Banner>
      )}

      {/* a. Resumen rápido en orden operativo */}
      <section
        aria-label="Resumen de hogares de paso"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryCard
          label="Seguimientos hoy"
          value={counts.seguimientosHoy}
          emphasis={counts.seguimientosHoy > 0}
        />
        <SummaryCard
          label="Solicitudes nuevas"
          value={counts.nuevas}
          emphasis={counts.nuevas > 0}
        />
        <SummaryCard
          label="Hogares por verificar"
          value={counts.porVerificar}
          emphasis={counts.porVerificar > 0}
        />
        <SummaryCard label="Hogares disponibles" value={counts.disponibles} />
      </section>

      {/* b. Seguimientos pendientes: la deuda del día, arriba de todo */}
      {conSeguimientoPendiente.length > 0 && (
        <section aria-labelledby="seguimientos-heading">
          <div className="mb-3 flex items-center gap-2">
            <h2
              id="seguimientos-heading"
              className="text-lg font-bold tracking-tight text-foreground"
            >
              📞 Seguimientos pendientes
            </h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
              {conSeguimientoPendiente.length}
            </span>
          </div>
          <p className="mb-3 text-sm text-foreground/65">
            Personas hospedadas a las que toca llamar HOY para confirmar que
            ambas partes están bien.
          </p>
          <ul className="flex flex-col gap-3">
            {conSeguimientoPendiente.map(({ solicitud, hito }) => (
              <li
                key={solicitud.id}
                className={`rounded-2xl border p-4 ${
                  solicitud.seguimientos.some((s) => !s.bien)
                    ? "border-red-300 bg-red-50/70"
                    : "border-accent-200 bg-accent-50/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-foreground">
                      {solicitud.nombre}
                    </h3>
                    <p className="mt-0.5 text-sm text-foreground/70">
                      {solicitud.ciudad} · toca la{" "}
                      <strong>{HITO_LABELS[hito].toLowerCase()}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLlamando({ solicitud, hito })}
                    disabled={busyId === solicitud.id}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === solicitud.id ? (
                      <Spinner className="size-4 text-white" />
                    ) : (
                      <span aria-hidden="true">📞</span>
                    )}
                    Registrar llamada
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* c. Hogares por verificar */}
      <section aria-labelledby="verificar-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="verificar-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Hogares por verificar
          </h2>
          {porVerificar.length > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-600 px-2 text-xs font-bold text-white">
              {porVerificar.length}
            </span>
          )}
        </div>
        <p className="mb-3 text-sm text-foreground/65">
          Llama al anfitrión, valida su documento y confirma quiénes viven en
          la casa antes de verificar.
        </p>

        {porVerificar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
            <span aria-hidden="true" className="block text-2xl">
              🎉
            </span>
            <p className="mt-1">No hay hogares esperando verificación.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {porVerificar.map((hogar) => (
              <HogarAdminCard
                key={hogar.id}
                hogar={hogar}
                busy={busyId === hogar.id}
                onVerificar={verificarHogar}
                onRechazar={rechazarHogar}
                onEliminar={eliminarHogar}
              />
            ))}
          </ul>
        )}
      </section>

      {/* d. Solicitudes por estado */}
      <section aria-labelledby="solicitudes-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="solicitudes-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Solicitudes de hospedaje
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-muted px-2 text-xs font-bold text-foreground/70">
            {listaSolicitudes.length}
          </span>
        </div>

        {listaSolicitudes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
            Aún no hay solicitudes de hospedaje.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {grupos.map(({ estado, items }) => (
              <div key={estado}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground/60">
                  {ESTADO_META[estado].label}
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-muted px-1.5 text-[11px] font-bold text-foreground/60">
                    {items.length}
                  </span>
                </h3>
                <ul className="flex flex-col gap-3">
                  {items.map((solicitud) => (
                    <SolicitudCard
                      key={solicitud.id}
                      solicitud={solicitud}
                      hogares={listaHogares}
                      busy={busyId === solicitud.id}
                      onBuscarHogar={setEmparejando}
                      onYaLlego={yaLlego}
                      onRegistrarLlamada={(s, hito) =>
                        setLlamando({ solicitud: s, hito })
                      }
                      onCerrar={cerrarSolicitud}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* e. Todos los hogares (mantenimiento) */}
      <section aria-labelledby="todos-hogares-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="todos-hogares-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Todos los hogares
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-muted px-2 text-xs font-bold text-foreground/70">
            {listaHogares.length}
          </span>
        </div>

        {listaHogares.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
            Aún no hay hogares registrados.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {listaHogares.map((hogar) => (
              <HogarRow
                key={hogar.id}
                hogar={hogar}
                busy={busyId === hogar.id}
                onCambiarVerificacion={cambiarVerificacion}
                onCambiarDisponibilidad={cambiarDisponibilidad}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Modales */}
      {emparejando && (
        <EmparejarModal
          solicitud={emparejando}
          hogares={listaHogares}
          onClose={() => setEmparejando(null)}
          onEmparejar={emparejar}
        />
      )}
      {llamando && (
        <SeguimientoModal
          solicitud={llamando.solicitud}
          hito={llamando.hito}
          onClose={() => setLlamando(null)}
          onSubmit={guardarSeguimiento}
        />
      )}
    </div>
  );
}

/** Tarjeta compacta del resumen superior (mismo look que en Dashboard). */
function SummaryCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        emphasis ? "border-sky-300 bg-sky-50" : "border-border bg-surface"
      }`}
    >
      <div className="text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-foreground/60">
        {label}
      </div>
    </div>
  );
}

/**
 * Fila compacta de un hogar en "Todos los hogares": verificación editable
 * (select) y disponibilidad con pausar/reactivar. Un hogar "ocupado" lo
 * gestiona el servidor al emparejar/cerrar, así que aquí no se toca.
 */
function HogarRow({
  hogar,
  busy,
  onCambiarVerificacion,
  onCambiarDisponibilidad,
}: {
  hogar: Hogar;
  busy: boolean;
  onCambiarVerificacion: (id: string, v: HogarVerificacion) => void;
  onCambiarDisponibilidad: (
    id: string,
    d: "disponible" | "pausado",
  ) => void;
}) {
  const dispMeta = DISPONIBILIDAD_META[hogar.disponibilidad];
  return (
    <li className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{hogar.nombre}</p>
          <p className="mt-0.5 text-sm text-foreground/65">
            {hogar.ciudad}
            {hogar.zona ? ` · ${hogar.zona}` : ""} · caben {hogar.capacidad}
          </p>
        </div>
        <EstadoBadge label={dispMeta.label} badge={dispMeta.badge} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        {/* Verificación editable en sitio */}
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
          Verificación
          <select
            value={hogar.verificacion}
            disabled={busy}
            onChange={(e) =>
              onCambiarVerificacion(
                hogar.id,
                e.target.value as HogarVerificacion,
              )
            }
            className="h-9 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-60"
          >
            {HOGAR_VERIFICACIONES.map((v) => (
              <option key={v} value={v}>
                {VERIFICACION_META[v].label}
              </option>
            ))}
          </select>
        </label>

        {hogar.disponibilidad === "disponible" && (
          <button
            type="button"
            onClick={() => onCambiarDisponibilidad(hogar.id, "pausado")}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground/80 transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            {busy ? <Spinner className="size-4" /> : <span aria-hidden="true">⏸️</span>}
            Pausar
          </button>
        )}
        {hogar.disponibilidad === "pausado" && (
          <button
            type="button"
            onClick={() => onCambiarDisponibilidad(hogar.id, "disponible")}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <span aria-hidden="true">▶️</span>
            )}
            Reactivar
          </button>
        )}
        {hogar.disponibilidad === "ocupado" && (
          <span className="text-xs font-medium text-foreground/55">
            Hospedando ahora; se libera al cerrar la solicitud.
          </span>
        )}
      </div>
    </li>
  );
}
