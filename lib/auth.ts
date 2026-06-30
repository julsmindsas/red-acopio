/**
 * Autenticación del panel administrativo (simple y segura para un MVP).
 *
 * Modelo: una sola contraseña de administrador (`ADMIN_PASSWORD`). Al iniciar
 * sesión se valida la contraseña y se entrega una cookie de sesión que NO
 * contiene la contraseña, sino un token firmado con HMAC-SHA256 usando un
 * secreto del servidor (`ADMIN_SESSION_SECRET`). Cada endpoint admin verifica
 * la cookie recomputando el token y comparándolo en tiempo constante.
 *
 * Variables de entorno:
 *   - ADMIN_PASSWORD        Contraseña del administrador (obligatoria para activar el panel).
 *   - ADMIN_SESSION_SECRET  Secreto para firmar la cookie (recomendado; si falta, se deriva de ADMIN_PASSWORD).
 */
import { createHmac, timingSafeEqual } from "crypto";

/** Nombre de la cookie de sesión del administrador. */
export const ADMIN_COOKIE = "ra_admin";

/** Vigencia de la sesión en segundos (12 horas). */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

/** ¿Está configurado el panel admin? (requiere ADMIN_PASSWORD) */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sessionSecret(): string {
  // Preferimos un secreto dedicado; si no existe, derivamos de la contraseña.
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "red-acopio-insecure-fallback"
  );
}

/** Comparación de cadenas en tiempo constante (evita ataques de temporización). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Verifica la contraseña enviada contra ADMIN_PASSWORD (tiempo constante). */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false; // panel deshabilitado si no hay contraseña
  return safeEqual(password, expected);
}

/** Genera el token de sesión (HMAC del secreto). No contiene la contraseña. */
export function makeSessionToken(): string {
  return createHmac("sha256", sessionSecret())
    .update("admin-session-v1")
    .digest("hex");
}

/** Verifica el token de la cookie de sesión (tiempo constante). */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || !adminConfigured()) return false;
  return safeEqual(token, makeSessionToken());
}

/** Atributos de la cookie de sesión (httpOnly, segura en producción). */
export function sessionCookieOptions(maxAge: number = ADMIN_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
