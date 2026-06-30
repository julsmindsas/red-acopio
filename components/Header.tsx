"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloseIcon, GithubIcon, MenuIcon } from "@/components/landing/icons";

/*
 * Encabezado de la app (Client Component por el menú móvil y el resaltado activo).
 * - Sticky con desenfoque: la marca y la navegación están siempre a mano.
 * - Navegación: Inicio, Mapa, Recomendar, API y enlace al repositorio (GitHub).
 * - El enlace activo se resalta usando `usePathname`.
 * - Móvil: menú desplegable simple (hamburguesa) con los mismos enlaces.
 *
 * `variant` ajusta el CTA principal de la derecha:
 *   - "home"   -> "Recomendar" (acción primaria de la app).
 *   - "report" -> "Ver mapa"   (en /reportar, volver al mapa).
 */

const REPO_URL = "https://github.com/julsmindsas/red-acopio";

/** Enlaces de navegación internos, en orden de aparición. */
const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/mapa", label: "Mapa" },
  { href: "/reportar", label: "Recomendar" },
  { href: "/api-docs", label: "API" },
] as const;

export default function Header({
  variant = "home",
}: {
  variant?: "home" | "report";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El inicio solo está activo en "/"; los demás aceptan subrutas.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        {/* Marca */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
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
              Colombia 🇨🇴 → Venezuela 🇻🇪
            </span>
          </span>
        </Link>

        {/* Navegación de escritorio */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
        </nav>

        {/* CTA principal + botón de menú móvil */}
        <div className="flex items-center gap-2">
          {variant === "report" ? (
            <Link
              href="/mapa"
              className="hidden h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted sm:inline-flex"
            >
              <span aria-hidden="true">←</span>
              Ver mapa
            </Link>
          ) : (
            <Link
              href="/reportar"
              className="hidden h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700 sm:inline-flex"
            >
              <span aria-hidden="true">＋</span>
              Recomendar
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Panel de navegación móvil */}
      {open && (
        <nav
          id="menu-movil"
          aria-label="Navegación principal (móvil)"
          className="border-t border-border bg-surface md:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-foreground/80 hover:bg-surface-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface-muted"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
