"use client";

import type { CenterWithDistance } from "@/lib/types";
import CenterCard from "./CenterCard";
import EmptyState from "./EmptyState";

/*
 * Lista de centros de acopio.
 * Recibe los centros ya filtrados y ordenados (por cercanía) desde HomeView,
 * y delega cada tarjeta a <CenterCard>. La selección se sincroniza con el mapa
 * a través de `selectedId` / `onSelect`.
 */

interface CenterListProps {
  centers: CenterWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Acción opcional mostrada en el estado vacío (ej. limpiar filtros). */
  emptyAction?: React.ReactNode;
}

export default function CenterList({
  centers,
  selectedId,
  onSelect,
  emptyAction,
}: CenterListProps) {
  if (centers.length === 0) {
    return (
      <EmptyState
        icon="🔎"
        title="Sin centros que coincidan"
        message="Prueba ajustando o quitando los filtros para ver más centros de acopio cercanos."
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {centers.map((center) => (
        <li key={center.id}>
          <CenterCard
            center={center}
            selected={center.id === selectedId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
