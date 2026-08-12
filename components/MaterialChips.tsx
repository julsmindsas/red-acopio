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
  /**
   * Máximo de chips visibles; el resto se resume en un "+N".
   *
   * Una tarjeta con siete etiquetas de material ocupaba dos líneas y competía
   * con la dirección. Tres bastan para saber si vale la pena acercarse; el
   * detalle completo se confirma llamando, que es lo que la app pide de todos
   * modos.
   */
  max,
}: {
  materials: MaterialCategory[];
  compact?: boolean;
  max?: number;
}) {
  if (materials.length === 0) return null;

  const visible = max ? materials.slice(0, max) : materials;
  const hidden = materials.length - visible.length;

  return (
    <ul
      className="flex flex-wrap gap-1.5"
      aria-label="Materiales que recibe este centro"
    >
      {visible.map((m) => (
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

      {hidden > 0 && (
        <li
          className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground/60"
          title={materials
            .slice(visible.length)
            .map((m) => MATERIAL_LABELS[m])
            .join(", ")}
        >
          +{hidden}
        </li>
      )}
    </ul>
  );
}
