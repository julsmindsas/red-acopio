import { STATUS_META } from "@/lib/constants";
import type { VerificationStatus } from "@/lib/types";

/*
 * Insignia de estado de verificación.
 * Reutiliza las clases Tailwind y la etiqueta de `STATUS_META` (única fuente de
 * verdad de la presentación de estados). Un punto de color refuerza la lectura
 * rápida en móvil sin depender solo del texto (accesibilidad por color + forma).
 */

const DOT_COLOR: Record<VerificationStatus, string> = {
  verificado: "bg-emerald-500",
  sin_verificar: "bg-amber-500",
  reportado: "bg-sky-500",
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badgeClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${DOT_COLOR[status]}`}
      />
      {meta.label}
    </span>
  );
}
