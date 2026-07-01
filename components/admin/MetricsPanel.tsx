"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMetrics, type AdminMetrics } from "./api";
import { Banner, Spinner } from "./ui";

/*
 * Panel de métricas de uso.
 * ------------------------------------------------------------------------
 * Al montar consulta GET /api/admin/metrics y muestra:
 *  1. Tres tarjetas de resumen (centros locales, reportes pendientes, consultas).
 *  2. Mini gráfica de barras con los reportes recibidos en los últimos 14 días
 *     (rellena con 0 los días sin datos para que la serie sea continua).
 *  3. Lista de los centros más consultados (top 10) con barra proporcional.
 *
 * Es autónomo respecto al resto del dashboard: gestiona su propia carga, error
 * (incluida la sesión expirada 401) y recarga manual mediante "Actualizar".
 */
export default function MetricsPanel() {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Carga de datos ------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    const res = await getMetrics();
    setLoading(false);
    if (!res.ok) {
      // El texto ya viene diferenciado para 401 (sesión expirada) desde api.ts.
      setError(res.error);
      return;
    }
    setError(null);
    setData(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // --- Render --------------------------------------------------------------
  return (
    <section
      aria-labelledby="metrics-heading"
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      {/* Encabezado con acción de recarga */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2
            id="metrics-heading"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          >
            <span aria-hidden="true">📊</span>
            Métricas de uso
          </h2>
          <p className="mt-0.5 text-sm text-foreground/60">
            Actividad reciente de la comunidad en la app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Spinner className="size-4 text-brand-600" />
          ) : (
            <span aria-hidden="true">↻</span>
          )}
          Actualizar
        </button>
      </div>

      {/* Estado: carga inicial (aún sin datos) */}
      {loading && data === null ? (
        <div className="flex flex-col items-center gap-3 py-10 text-foreground/60">
          <Spinner className="size-6 text-brand-600" />
          <p className="text-sm">Cargando métricas…</p>
        </div>
      ) : error && data === null ? (
        /* Estado: error de carga inicial (incluye 401 sesión expirada) */
        <Banner tone="error">
          {error}{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold underline underline-offset-2"
          >
            Reintentar
          </button>
        </Banner>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* Aviso de error en una recarga posterior (ya teníamos datos) */}
          {error && (
            <Banner tone="error" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          {/* 1. Tarjetas de resumen */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon="🏫"
              label="Centros locales"
              value={data.totals.centrosLocales}
            />
            <StatCard
              icon="📝"
              label="Reportes pendientes"
              value={data.totals.reportesPendientes}
              emphasis={data.totals.reportesPendientes > 0}
            />
            <StatCard
              icon="👀"
              label="Consultas totales"
              value={data.totals.totalVisitas}
            />
          </div>

          {/* 2. Reportes recibidos (últimos 14 días) */}
          <ReportsChart reportesPorDia={data.reportesPorDia} />

          {/* 3. Centros más consultados */}
          <MostConsulted items={data.masConsultados} />
        </div>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarjeta de estadística                                                     */
/* -------------------------------------------------------------------------- */

/** Tarjeta compacta con ícono, valor grande y etiqueta. */
function StatCard({
  icon,
  label,
  value,
  emphasis = false,
}: {
  icon: string;
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
        emphasis ? "border-sky-300 bg-sky-50" : "border-border bg-surface-muted/40"
      }`}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-xl shadow-sm"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums leading-none text-foreground">
          {value.toLocaleString("es-CO")}
        </div>
        <div className="mt-1 text-xs font-medium text-foreground/60">{label}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gráfica de reportes por día (últimos 14 días)                              */
/* -------------------------------------------------------------------------- */

/** Formatea una fecha local como clave "YYYY-MM-DD" (coincide con la API). */
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Mini gráfica de barras hecha solo con divs + Tailwind.
 * Rellena los 14 días con 0 donde la API no devolvió datos, para que la serie
 * sea continua y visualmente comparable.
 */
function ReportsChart({
  reportesPorDia,
}: {
  reportesPorDia: AdminMetrics["reportesPorDia"];
}) {
  const dias = useMemo(() => {
    // Índice fecha -> cantidad para consultas O(1).
    const porFecha = new Map(reportesPorDia.map((r) => [r.fecha, r.cantidad]));
    const hoy = new Date();
    // 14 días terminando hoy (índice 0 = hace 13 días).
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (13 - i));
      const key = toKey(d);
      return {
        key,
        cantidad: porFecha.get(key) ?? 0,
        // Etiquetas cortas para el eje: día del mes + inicial del día de semana.
        diaMes: d.getDate(),
        diaSemana: d.toLocaleDateString("es-CO", { weekday: "short" }),
      };
    });
  }, [reportesPorDia]);

  const total = useMemo(
    () => dias.reduce((acc, d) => acc + d.cantidad, 0),
    [dias],
  );
  const max = useMemo(
    () => Math.max(1, ...dias.map((d) => d.cantidad)),
    [dias],
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">
          Reportes recibidos
          <span className="ml-1.5 font-normal text-foreground/55">
            (últimos 14 días)
          </span>
        </h3>
        <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/60">
          {total} en total
        </span>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
          <span aria-hidden="true" className="block text-2xl">
            🗓️
          </span>
          <p className="mt-1">
            No se han recibido reportes ciudadanos en los últimos 14 días.
          </p>
        </div>
      ) : (
        <div
          role="img"
          aria-label={`Reportes recibidos por día en los últimos 14 días. Total: ${total}.`}
          className="rounded-2xl border border-border bg-surface-muted/30 p-3 sm:p-4"
        >
          <div className="flex h-32 items-end gap-1 sm:gap-1.5">
            {dias.map((d) => {
              const pct = (d.cantidad / max) * 100;
              return (
                <div
                  key={d.key}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${d.diaSemana} ${d.diaMes}: ${d.cantidad} ${
                    d.cantidad === 1 ? "reporte" : "reportes"
                  }`}
                >
                  {/* Número del valor (solo cuando hay reportes) */}
                  {d.cantidad > 0 && (
                    <span className="text-[10px] font-semibold tabular-nums leading-none text-foreground/70">
                      {d.cantidad}
                    </span>
                  )}
                  {/* Barra proporcional; min-height para que un 0 se distinga */}
                  <div
                    className={`w-full rounded-t-md transition-[height] ${
                      d.cantidad > 0
                        ? "bg-brand-500 group-hover:bg-brand-600"
                        : "bg-border/70"
                    }`}
                    style={{
                      height: d.cantidad > 0 ? `${Math.max(pct, 6)}%` : "3px",
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* Eje X: día del mes debajo de cada barra */}
          <div className="mt-1.5 flex gap-1 sm:gap-1.5">
            {dias.map((d) => (
              <div
                key={d.key}
                className="flex-1 text-center text-[10px] tabular-nums text-foreground/45"
              >
                {d.diaMes}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Centros más consultados                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Lista top 10 de centros por número de consultas, con una barrita
 * proporcional al máximo. Si viene vacía, explica cuándo se registran datos.
 */
function MostConsulted({
  items,
}: {
  items: AdminMetrics["masConsultados"];
}) {
  const max = useMemo(
    () => Math.max(1, ...items.map((i) => i.visitas)),
    [items],
  );

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-foreground">
        Centros más consultados
      </h3>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-foreground/60">
          <span aria-hidden="true" className="block text-2xl">
            📍
          </span>
          <p className="mt-1">
            Aún no hay consultas registradas. Se contabilizan cuando las personas
            pulsan «Cómo llegar» o «Llamar» en un centro.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {items.map((item, idx) => {
            const pct = (item.visitas / max) * 100;
            return (
              <li key={item.centerId} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      aria-hidden="true"
                      className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground/40"
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.centerName}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground/70">
                    {item.visitas.toLocaleString("es-CO")}
                    <span className="ml-1 text-xs font-normal text-foreground/45">
                      {item.visitas === 1 ? "consulta" : "consultas"}
                    </span>
                  </span>
                </div>
                {/* Barra proporcional (decorativa; el dato ya está en texto) */}
                <div
                  aria-hidden="true"
                  className="ml-6 h-2 overflow-hidden rounded-full bg-surface-muted"
                >
                  <div
                    className="h-full rounded-full bg-accent-500"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
