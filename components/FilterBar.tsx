"use client";

import {
  MATERIAL_CATEGORIES,
  MATERIAL_EMOJI,
  MATERIAL_LABELS,
  STATUS_META,
  VERIFICATION_STATUSES,
} from "@/lib/constants";
import type { MaterialCategory, VerificationStatus } from "@/lib/types";

/*
 * Barra de filtros — diseñada para ser EXTENSIBLE.
 * -------------------------------------------------------------------------
 * Hoy filtra por material y por estado de verificación. Cada filtro es un
 * grupo de "chips" tipo toggle (multi-selección): si no hay nada marcado, no
 * se filtra por ese criterio.
 *
 * Cómo agregar un filtro nuevo (ej. "abierto ahora", "radio de distancia"):
 *   1. Añade su estado en HomeView (otro Set/valor) y pásalo aquí por props.
 *   2. Renderiza un nuevo <FilterGroup> o control debajo de los existentes.
 *   3. Aplica el criterio en el `useMemo` de filtrado de HomeView.
 * Mantén cada filtro independiente para no acoplar la lógica.
 */

interface FilterBarProps {
  materialFilter: Set<MaterialCategory>;
  statusFilter: Set<VerificationStatus>;
  onToggleMaterial: (m: MaterialCategory) => void;
  onToggleStatus: (s: VerificationStatus) => void;
  onClear: () => void;
  /** Número de resultados tras aplicar los filtros (para feedback al usuario). */
  resultCount: number;
}

/** Chip reutilizable con estado presionado accesible (`aria-pressed`). */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25"
          : "border-border bg-surface text-foreground/80 hover:border-brand-300 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  materialFilter,
  statusFilter,
  onToggleMaterial,
  onToggleStatus,
  onClear,
  resultCount,
}: FilterBarProps) {
  const hasActiveFilters = materialFilter.size > 0 || statusFilter.size > 0;

  return (
    <section
      aria-label="Filtros de centros de acopio"
      className="flex flex-col gap-3"
    >
      {/* Grupo: materiales */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="px-0.5 text-xs font-semibold uppercase tracking-wide text-foreground/55">
            ¿Qué quieres donar?
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {/* Fila desplazable horizontalmente en móvil para no consumir alto */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MATERIAL_CATEGORIES.map((m) => (
            <Chip
              key={m}
              active={materialFilter.has(m)}
              onClick={() => onToggleMaterial(m)}
            >
              <span aria-hidden="true">{MATERIAL_EMOJI[m]}</span>
              {MATERIAL_LABELS[m]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Grupo: estado de verificación */}
      <div className="flex flex-col gap-1.5">
        <h2 className="px-0.5 text-xs font-semibold uppercase tracking-wide text-foreground/55">
          Estado de la información
        </h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {VERIFICATION_STATUSES.map((s) => (
            <Chip
              key={s}
              active={statusFilter.has(s)}
              onClick={() => onToggleStatus(s)}
            >
              {STATUS_META[s].label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Feedback en vivo del número de resultados (lectores de pantalla incluidos) */}
      <p aria-live="polite" className="px-0.5 text-xs text-foreground/60">
        {resultCount === 0
          ? "No hay centros que coincidan con los filtros."
          : `Mostrando ${resultCount} ${
              resultCount === 1 ? "centro" : "centros"
            }.`}
      </p>
    </section>
  );
}
