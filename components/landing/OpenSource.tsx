import { GithubIcon } from "./icons";

/*
 * Sección Open Source + atribución a la fuente verificada (Server Component).
 * Dos tarjetas:
 *   1. Proyecto libre (MIT) con CTAs a GitHub: contribuir / reportar.
 *   2. Atribución respetuosa a acopiove.org como fuente de datos verificados.
 */

const REPO_URL = "https://github.com/julsmindsas/red-acopio";

export default function OpenSource() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Open source */}
        <div className="flex flex-col rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-8">
          <span aria-hidden="true" className="text-3xl">
            💚
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Hecho en abierto, para la comunidad
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/70 sm:text-base">
            Red de Acopio es software libre con licencia{" "}
            <strong className="font-semibold text-foreground">MIT</strong>.
            Cualquiera puede revisarlo, mejorarlo o desplegar su propia versión.
            Las buenas ideas —y los pull requests— son bienvenidas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <GithubIcon className="size-4" />
              Contribuir en GitHub
            </a>
            <a
              href={`${REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Reportar un problema
            </a>
          </div>
        </div>

        {/* Atribución a acopiove.org */}
        <div className="flex flex-col rounded-3xl border border-brand-200 bg-brand-50/60 p-7 shadow-sm sm:p-8">
          <span aria-hidden="true" className="text-3xl">
            🛡️
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Datos verificados de acopiove.org
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/70 sm:text-base">
            Los centros marcados como{" "}
            <strong className="font-semibold text-emerald-700">
              verificados
            </strong>{" "}
            provienen de la red oficial{" "}
            <strong className="font-semibold text-foreground">acopiove.org</strong>
            , que coordina la ayuda para Venezuela. Gracias a su trabajo la
            información es confiable; el resto de puntos son aportes de la
            comunidad, claramente identificados.
          </p>
          <a
            href="https://acopiove.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center gap-2 self-start rounded-full border border-brand-300 bg-surface px-5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100"
          >
            Visitar acopiove.org
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
