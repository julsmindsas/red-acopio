"use client";

import StatusBadge from "@/components/StatusBadge";
import MaterialChips from "@/components/MaterialChips";
import type { Center } from "@/lib/types";
import CenterActions from "./CenterActions";

/*
 * Listado de TODOS los centros locales.
 * ------------------------------------------------------------------------
 * Responsive por diseño (mobile-first):
 *  - En móvil/tablet: una pila de tarjetas (`lg:hidden`).
 *  - En escritorio (lg+): una tabla con columnas.
 * Ambas vistas comparten el mismo componente de acciones (<CenterActions/>),
 * así que "Editar" y "Eliminar" se comportan igual en cualquier tamaño.
 */
export default function CentersTable({
  centers,
  busyId,
  onEdit,
  onDelete,
}: {
  centers: Center[];
  /** Id del centro con una acción en curso (deshabilita sus botones). */
  busyId: string | null;
  onEdit: (center: Center) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {/* --- Vista móvil: tarjetas --- */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {centers.map((center) => (
          <li
            key={center.id}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{center.name}</h3>
                <p className="mt-0.5 text-sm text-foreground/65">
                  {center.address}
                </p>
              </div>
              <StatusBadge status={center.status} />
            </div>
            <div className="mt-3">
              <MaterialChips materials={center.materials} compact />
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <CenterActions
                center={center}
                busy={busyId === center.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* --- Vista escritorio: tabla --- */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wide text-foreground/55">
              <th scope="col" className="px-4 py-3 font-semibold">
                Centro
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Materiales
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {centers.map((center) => (
              <tr
                key={center.id}
                className="border-b border-border/70 last:border-0 align-top transition-colors hover:bg-surface-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {center.name}
                  </div>
                  <div className="mt-0.5 text-xs text-foreground/60">
                    {center.address}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <MaterialChips materials={center.materials} compact />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={center.status} />
                </td>
                <td className="px-4 py-3">
                  <CenterActions
                    center={center}
                    busy={busyId === center.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    align="end"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
