import { MATERIAL_EMOJI, MATERIAL_LABELS } from "@/lib/constants";
import type { MaterialCategory } from "@/lib/types";

/*
 * Chips de materiales que recibe un centro.
 * `compact` muestra solo el emoji (útil cuando el espacio es muy reducido);
 * por defecto muestra emoji + etiqueta legible.
 */

export default function MaterialChips({
  materials,
  compact = false,
}: {
  materials: MaterialCategory[];
  compact?: boolean;
}) {
  if (materials.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap gap-1.5"
      aria-label="Materiales que recibe este centro"
    >
      {materials.map((m) => (
        <li
          key={m}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-600/15"
          title={MATERIAL_LABELS[m]}
        >
          <span aria-hidden="true">{MATERIAL_EMOJI[m]}</span>
          {compact ? (
            <span className="sr-only">{MATERIAL_LABELS[m]}</span>
          ) : (
            MATERIAL_LABELS[m]
          )}
        </li>
      ))}
    </ul>
  );
}
