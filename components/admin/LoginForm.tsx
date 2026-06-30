"use client";

import { useState } from "react";
import { login } from "./api";
import { Banner, Field, Spinner, inputClass } from "./ui";

/*
 * Formulario de acceso al panel administrativo.
 * ------------------------------------------------------------------------
 * Pide la contraseña del panel y hace POST /api/admin/login. Al éxito invoca
 * `onAuthenticated`, que en el contenedor vuelve a consultar /api/admin/session
 * (no asumimos el estado: lo confirmamos contra el servidor).
 *
 * Manejo de errores:
 *  - 401 -> "Contraseña incorrecta".
 *  - 503 -> el panel está deshabilitado en el servidor.
 *  - otros / red -> mensaje genérico devuelto por la API.
 */
export default function LoginForm({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const res = await login(password);

    if (res.ok) {
      // Limpiamos la contraseña de memoria y dejamos que el contenedor
      // reconfirme la sesión contra el servidor.
      setPassword("");
      setSubmitting(false);
      onAuthenticated();
      return;
    }

    // Mensajes específicos por código; si la API trae uno propio, lo preferimos.
    let message = res.error;
    if (res.status === 401) message = "Contraseña incorrecta. Inténtalo de nuevo.";
    else if (res.status === 503)
      message =
        "El panel está deshabilitado en el servidor (falta la contraseña de administración).";

    setError(message);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-sm shadow-brand-600/30"
          >
            🔐
          </span>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-foreground">
            Acceso administrativo
          </h1>
          <p className="mt-1 text-sm text-foreground/65">
            Ingresa la contraseña para gestionar los centros de acopio.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {error && <Banner tone="error">{error}</Banner>}

          <Field label="Contraseña" htmlFor="admin-password" required>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!error}
              className={inputClass(!!error)}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="size-4 text-white" />
                Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
