"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Center, CenterPatch } from "@/lib/types";
import { STATUS_META } from "@/lib/constants";
import {
  deleteCenter,
  getCenters,
  patchCenter,
  type Result,
} from "./api";
import { Banner, Spinner } from "./ui";
import PendingCard from "./PendingCard";
import CentersTable from "./CentersTable";
import EditCenterForm from "./EditCenterForm";

/*
 * Panel principal (autenticado).
 * ------------------------------------------------------------------------
 * Carga los centros locales y centraliza TODAS las acciones (aprobar, marcar
 * sin verificar, editar y eliminar). Tras cada acción exitosa vuelve a pedir la
 * lista (`reload`) para reflejar el estado real del servidor.
 *
 * Si cualquier llamada responde 401, avisa al contenedor vía `onSessionLost`
 * para volver a la pantalla de login.
 *
 * Secciones:
 *  1. Recomendaciones pendientes (status === "reportado").
 *  2. Tabla/lista de todos los centros locales.
 */
export default function Dashboard({
  onSessionLost,
}: {
  onSessionLost: () => void;
}) {
  const [centers, setCenters] = useState<Center[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Center | null>(null);

  // --- Carga de datos ------------------------------------------------------
  const reload = useCallback(async () => {
    setLoading(true);
    const res = await getCenters();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) {
        onSessionLost();
        return;
      }
      setLoadError(res.error);
      return;
    }
    setLoadError(null);
    setCenters(res.data);
  }, [onSessionLost]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // El aviso de éxito se autodescarta a los 4s; los errores permanecen.
  useEffect(() => {
    if (flash?.tone !== "success") return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  // --- Acciones de red -----------------------------------------------------

  /**
   * Ejecuta un PATCH marcando el centro como ocupado y recargando al terminar.
   * Devuelve el `Result` para que el modal de edición pueda pintar errores por
   * campo. El aviso (éxito/error) lo decide cada quien que lo invoca.
   */
  const runPatch = useCallback(
    async (id: string, patch: CenterPatch): Promise<Result<Center>> => {
      setBusyId(id);
      const res = await patchCenter(id, patch);
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

  const approve = useCallback(
    async (id: string) => {
      const res = await runPatch(id, { status: "verificado" });
      setFlash(
        res.ok
          ? { tone: "success", text: "Centro aprobado y marcado como verificado." }
          : { tone: "error", text: res.error },
      );
    },
    [runPatch],
  );

  const unverify = useCallback(
    async (id: string) => {
      const res = await runPatch(id, { status: "sin_verificar" });
      setFlash(
        res.ok
          ? { tone: "success", text: "Centro marcado como sin verificar." }
          : { tone: "error", text: res.error },
      );
    },
    [runPatch],
  );

  const remove = useCallback(
    async (id: string) => {
      setBusyId(id);
      const res = await deleteCenter(id);
      setBusyId(null);
      if (res.ok) {
        if (editing?.id === id) setEditing(null);
        setFlash({ tone: "success", text: "Centro eliminado." });
        await reload();
      } else if (res.status === 401) {
        onSessionLost();
      } else {
        setFlash({ tone: "error", text: res.error });
      }
    },
    [reload, onSessionLost, editing],
  );

  // Guardado desde el modal de edición.
  const submitEdit = useCallback(
    async (patch: CenterPatch): Promise<Result<Center>> => {
      if (!editing) {
        return { ok: false, status: 0, error: "No hay centro seleccionado." };
      }
      const res = await runPatch(editing.id, patch);
      if (res.ok) {
        setEditing(null);
        setFlash({ tone: "success", text: "Centro actualizado." });
      }
      return res;
    },
    [editing, runPatch],
  );

  // --- Derivados -----------------------------------------------------------
  const pending = useMemo(
    () => (centers ?? []).filter((c) => c.status === "reportado"),
    [centers],
  );

  const counts = useMemo(() => {
    const list = centers ?? [];
    return {
      total: list.length,
      verificado: list.filter((c) => c.status === "verificado").length,
      sin_verificar: list.filter((c) => c.status === "sin_verificar").length,
      reportado: pending.length,
    };
  }, [centers, pending]);

  // --- Render --------------------------------------------------------------

  // Carga inicial (aún sin datos).
  if (loading && centers === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-foreground/60">
        <Spinner className="size-7 text-brand-600" />
        <p className="text-sm">Cargando centros…</p>
      </div>
    );
  }

  // Fallo de carga inicial.
  if (loadError && centers === null) {
    return (
      <div className="py-10">
        <Banner tone="error">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => void reload()}
            className="font-semibold underline underline-offset-2"
          >
            Reintentar
          </button>
        </Banner>
      </div>
    );
  }

  const list = centers ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso flotante de la última acción */}
      {flash && (
        <Banner tone={flash.tone} onDismiss={() => setFlash(null)}>
          {flash.text}
        </Banner>
      )}

      {/* Aviso de error de recarga (cuando ya teníamos datos) */}
      {loadError && centers !== null && (
        <Banner tone="error" onDismiss={() => setLoadError(null)}>
          {loadError}
        </Banner>
      )}

      {/* Resumen rápido */}
      <section
        aria-label="Resumen"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryCard label="Centros locales" value={counts.total} />
        <SummaryCard
          label={STATUS_META.reportado.label}
          value={counts.reportado}
          emphasis={counts.reportado > 0}
        />
        <SummaryCard label={STATUS_META.verificado.label} value={counts.verificado} />
        <SummaryCard
          label={STATUS_META.sin_verificar.label}
          value={counts.sin_verificar}
        />
      </section>

      {/* 1. Recomendaciones pendientes */}
      <section aria-labelledby="pending-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="pending-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Recomendaciones pendientes
          </h2>
          {pending.length > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-600 px-2 text-xs font-bold text-white">
              {pending.length}
            </span>
          )}
        </div>
        <p className="mb-3 text-sm text-foreground/65">
          Centros enviados por la comunidad que esperan tu revisión.
        </p>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
            <span aria-hidden="true" className="block text-2xl">
              🎉
            </span>
            <p className="mt-1">No hay recomendaciones pendientes por revisar.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((center) => (
              <PendingCard
                key={center.id}
                center={center}
                busy={busyId === center.id}
                onApprove={approve}
                onUnverify={unverify}
                onDelete={remove}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 2. Todos los centros locales */}
      <section aria-labelledby="all-heading">
        <div className="mb-3 flex items-center gap-2">
          <h2
            id="all-heading"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Todos los centros locales
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-muted px-2 text-xs font-bold text-foreground/70">
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
            Aún no hay centros locales registrados.
          </div>
        ) : (
          <CentersTable
            centers={list}
            busyId={busyId}
            onEdit={setEditing}
            onDelete={remove}
          />
        )}
      </section>

      {/* Modal de edición */}
      {editing && (
        <EditCenterForm
          center={editing}
          onClose={() => setEditing(null)}
          onSubmit={submitEdit}
        />
      )}
    </div>
  );
}

/** Tarjeta compacta del resumen superior. */
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
        emphasis
          ? "border-sky-300 bg-sky-50"
          : "border-border bg-surface"
      }`}
    >
      <div className="text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-foreground/60">{label}</div>
    </div>
  );
}
