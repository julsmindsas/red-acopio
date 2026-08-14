"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSession, logout } from "./api";
import { Banner, Spinner } from "./ui";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";
import HogaresPanel from "./hogares/HogaresPanel";

/*
 * Contenedor del panel administrativo (raíz cliente).
 * ------------------------------------------------------------------------
 * Es la máquina de estados de la sesión. Al montar consulta
 * GET /api/admin/session y decide qué mostrar:
 *
 *   loading      -> spinner mientras se consulta la sesión
 *   unconfigured -> aviso "Panel no configurado" (falta ADMIN_PASSWORD)
 *   login        -> <LoginForm/>
 *   dashboard    -> <Dashboard/>
 *   error        -> no se pudo verificar la sesión (con reintento)
 *
 * Mantiene la cabecera (marca + "Cerrar sesión") y delega el contenido a cada
 * pantalla. El cierre de sesión y la pérdida de sesión (401) devuelven a login.
 */

type Phase = "loading" | "unconfigured" | "login" | "dashboard" | "error";

/** Pestañas del dashboard: centros de acopio u hogares de paso. */
type Tab = "centros" | "hogares";

export default function AdminPanel() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tab, setTab] = useState<Tab>("centros");

  // Vuelve a consultar el estado de sesión y ajusta la fase. Sin setState
  // síncrono antes del `await`: se invoca desde el efecto de montaje y la
  // regla react-hooks/set-state-in-effect lo veta ("loading" ya es la fase
  // inicial, así que el spinner de arranque no lo necesita).
  const refresh = useCallback(async () => {
    const res = await fetchSession();
    if (!res.ok) {
      setError(res.error);
      setPhase("error");
      return;
    }
    if (!res.data.configured) {
      setPhase("unconfigured");
      return;
    }
    setPhase(res.data.authenticated ? "dashboard" : "login");
  }, []);

  // Disparo diferido de la consulta inicial: la regla
  // react-hooks/set-state-in-effect veta invocar directamente en el efecto
  // una función que hace setState; dentro del callback del timer sí es válido.
  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setPhase("login");
  }, []);

  return (
    <>
      {/* Cabecera del panel */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-foreground text-lg text-background shadow-sm"
            >
              🛠️
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">
                Panel administrativo
              </span>
              <span className="text-[11px] font-medium text-foreground/55">
                Red de Acopio · gestión de centros
              </span>
            </div>
          </div>

          {phase === "dashboard" && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              {loggingOut ? (
                <Spinner className="size-4 text-foreground/70" />
              ) : (
                <span aria-hidden="true">🔓</span>
              )}
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-20 text-foreground/60">
            <Spinner className="size-7 text-brand-600" />
            <p className="text-sm">Verificando sesión…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="mx-auto max-w-md py-10">
            <Banner tone="error">
              {error ?? "No se pudo verificar la sesión."}{" "}
              <button
                type="button"
                onClick={() => {
                  // Reintento manual: aquí sí volvemos al spinner (evento).
                  setError(null);
                  setPhase("loading");
                  void refresh();
                }}
                className="font-semibold underline underline-offset-2"
              >
                Reintentar
              </button>
            </Banner>
          </div>
        )}

        {phase === "unconfigured" && (
          <div className="mx-auto max-w-md py-10">
            <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 text-center">
              <span aria-hidden="true" className="text-3xl">
                ⚙️
              </span>
              <h1 className="mt-2 text-lg font-bold text-accent-900">
                Panel no configurado
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-accent-900/80">
                El panel administrativo está deshabilitado porque falta definir
                la contraseña de administración (<code>ADMIN_PASSWORD</code>) en
                el servidor. Configúrala y vuelve a cargar esta página.
              </p>
            </div>
          </div>
        )}

        {phase === "login" && <LoginForm onAuthenticated={refresh} />}

        {phase === "dashboard" && (
          <>
            {/* Pestañas: centros de acopio / hogares de paso */}
            <div
              role="tablist"
              aria-label="Secciones del panel"
              className="mb-5 flex gap-1 rounded-full border border-border bg-surface-muted/60 p-1"
            >
              {(
                [
                  { id: "centros", label: "🏥 Centros" },
                  { id: "hogares", label: "🏡 Hogares de paso" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "centros" ? (
              <Dashboard onSessionLost={() => setPhase("login")} />
            ) : (
              <HogaresPanel onSessionLost={() => setPhase("login")} />
            )}
          </>
        )}
      </main>
    </>
  );
}
