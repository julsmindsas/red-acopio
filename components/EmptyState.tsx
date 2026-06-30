import type { ReactNode } from "react";

/*
 * Estado vacío reutilizable (sin centros, sin resultados de filtro, etc.).
 * Mantiene un tono amable y propone una acción cuando es posible.
 */

export default function EmptyState({
  icon = "📍",
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span aria-hidden="true" className="text-4xl">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-foreground/70">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
