/**
 * Primitivas de UI compartidas del panel administrativo.
 * --------------------------------------------------------------------------
 * Pequeños bloques reutilizables (avisos, spinner, campos de formulario y el
 * selector de materiales) para mantener consistencia visual entre la pantalla
 * de login, el dashboard y el formulario de edición. Reutilizan los tokens de
 * color de marca definidos en `globals.css`.
 */
import { MATERIAL_CATEGORIES, MATERIAL_EMOJI, MATERIAL_LABELS } from "@/lib/constants";
import type { MaterialCategory } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Spinner                                                                    */
/* -------------------------------------------------------------------------- */

/** Indicador de carga circular. El color se hereda de `currentColor`. */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current/25 border-t-current ${className}`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Banner (aviso de éxito / error / info)                                     */
/* -------------------------------------------------------------------------- */

type BannerTone = "success" | "error" | "info";

const BANNER_TONES: Record<BannerTone, string> = {
  success: "border-brand-300 bg-brand-50 text-brand-900",
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-accent-200 bg-accent-50 text-accent-900",
};

const BANNER_ICON: Record<BannerTone, string> = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️",
};

/**
 * Aviso contextual. Los errores usan `role="alert"` (anuncio inmediato) y el
 * resto `role="status"` (anuncio educado) para lectores de pantalla.
 */
export function Banner({
  tone = "info",
  children,
  onDismiss,
  className = "",
}: {
  tone?: BannerTone;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${BANNER_TONES[tone]} ${className}`}
    >
      <span aria-hidden="true" className="mt-px shrink-0">
        {BANNER_ICON[tone]}
      </span>
      <div className="flex-1 leading-relaxed">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Descartar aviso"
          className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Campos de formulario                                                       */
/* -------------------------------------------------------------------------- */

/** Clases base de inputs/textarea/select; resalta en rojo cuando hay error. */
export function inputClass(hasError = false): string {
  return `w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${
    hasError ? "border-red-400 focus:ring-red-400/40" : "border-border"
  }`;
}

/** Envoltorio de campo: etiqueta, pista opcional, control y mensaje de error. */
export function Field({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {hint && <p className="-mt-0.5 text-xs text-foreground/55">{hint}</p>}
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Selector de materiales (checkboxes)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Cuadrícula de materiales con casillas. Recibe el conjunto seleccionado y
 * notifica cada cambio mediante `onToggle`. Patrón visual idéntico al del
 * formulario ciudadano para que admins y reportantes vean lo mismo.
 */
export function MaterialPicker({
  selected,
  onToggle,
  error,
}: {
  selected: Set<MaterialCategory>;
  onToggle: (m: MaterialCategory) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">
        Materiales que recibe{" "}
        <span className="text-red-600" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MATERIAL_CATEGORIES.map((m) => {
          const checked = selected.has(m);
          return (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                checked
                  ? "border-brand-600 bg-brand-50 text-brand-900"
                  : "border-border bg-surface text-foreground/80 hover:border-brand-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(m)}
                className="size-4 accent-brand-600"
              />
              <span aria-hidden="true">{MATERIAL_EMOJI[m]}</span>
              <span className="leading-tight">{MATERIAL_LABELS[m]}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
