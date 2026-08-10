import Link from "next/link";
import { GithubIcon } from "./icons";

/*
 * Pie de página de la app (Server Component).
 * - Identidad + tagline.
 * - Columnas de navegación: Explorar y Desarrolladores.
 * - Aviso destacado "Verifica antes de donar" (postura de datos del proyecto).
 * - Línea legal: licencia MIT y atribución a acopiove.org.
 */

const REPO_URL = "https://github.com/julsmindsas/red-acopio";

type FooterLink = { href: string; label: string; external?: boolean };

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/45">
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-foreground/70 transition-colors hover:text-brand-700"
              >
                {link.label}
                <span aria-hidden="true" className="text-xs">
                  ↗
                </span>
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-foreground/70 transition-colors hover:text-brand-700"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-border bg-surface/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm shadow-brand-600/30"
              >
                🤝
              </span>
              <span className="text-base font-bold tracking-tight text-foreground">
                Red de Acopio
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/65">
              Mapa abierto de albergues y centros de acopio tras el sismo del 10
              de agosto de 2026. De la comunidad, para la comunidad.
            </p>
            <p className="mt-3 text-xs text-foreground/50">
              <span aria-hidden="true">🇨🇴</span> Colombia
            </p>
          </div>

          <FooterColumn
            title="Explorar"
            links={[
              { href: "/mapa", label: "Mapa de puntos" },
              { href: "/ayuda", label: "Cómo ayudar" },
              { href: "/reportar", label: "Recomendar un punto" },
            ]}
          />

          <FooterColumn
            title="Desarrolladores"
            links={[
              { href: "/api-docs", label: "Documentación de la API" },
              { href: REPO_URL, label: "Repositorio en GitHub", external: true },
            ]}
          />
        </div>

        {/* Aviso destacado: verifica antes de donar */}
        <div className="mt-10 flex items-start gap-2.5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span aria-hidden="true" className="mt-px shrink-0 text-base">
            ⚠️
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">Confirma antes de ir.</strong> La
            información es comunitaria y en una emergencia cambia por horas.
            Verifica que el punto siga operando —y qué está recibiendo— antes de
            desplazarte. Si es una emergencia, llama al{" "}
            <a href="tel:123" className="font-bold underline underline-offset-2">
              123
            </a>
            .
          </p>
        </div>

        {/* Línea legal */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-foreground/55 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Red de Acopio · Licencia MIT ·
            Código abierto
          </p>
          <p className="flex items-center gap-1.5">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Repositorio en GitHub"
              className="inline-flex items-center gap-1 transition-colors hover:text-brand-700"
            >
              <GithubIcon className="size-3.5" />
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            Mapas ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 hover:underline"
            >
              OpenStreetMap
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
