import Link from "next/link";

/*
 * Encabezado de la app.
 * - Sticky para que la identidad y el acceso a "Recomendar" estén siempre a mano.
 * - Identidad: marca cálida con icono. Touch target amplio en el enlace de acción.
 *
 * `variant="report"` ajusta el CTA: en la página de recomendación el enlace
 * lleva de vuelta al mapa en lugar de repetir "Recomendar".
 */

export default function Header({
  variant = "home",
}: {
  variant?: "home" | "report";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg py-1 pr-2"
          aria-label="Red de Acopio — ir al inicio"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm shadow-brand-600/30"
          >
            🤝
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-foreground">
              Red de Acopio
            </span>
            <span className="text-[11px] font-medium text-foreground/55">
              Medellín · ayuda humanitaria
            </span>
          </span>
        </Link>

        {variant === "report" ? (
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            <span aria-hidden="true">←</span>
            Ver mapa
          </Link>
        ) : (
          <Link
            href="/reportar"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            <span aria-hidden="true">＋</span>
            <span className="hidden sm:inline">Recomendar un centro</span>
            <span className="sm:hidden">Recomendar</span>
          </Link>
        )}
      </div>
    </header>
  );
}
