import type { ReactNode } from "react";

/*
 * "Pill" para destacar atributos de la API (OpenAPI 3.1, CORS, MIT, métodos…).
 * `tone` ajusta el color manteniendo coherencia con la paleta esmeralda/ámbar.
 * Es un Server Component puro (sin estado): solo presentación.
 */

type Tone = "brand" | "neutral" | "accent" | "sky";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-800 ring-brand-600/20",
  neutral: "bg-surface-muted text-foreground/70 ring-border",
  accent: "bg-accent-100 text-accent-800 ring-accent-600/20",
  sky: "bg-sky-100 text-sky-800 ring-sky-600/20",
};

export default function Badge({
  children,
  tone = "brand",
  icon,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
