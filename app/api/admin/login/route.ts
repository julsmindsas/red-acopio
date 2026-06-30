/**
 * POST /api/admin/login
 *
 * Autentica al administrador con ADMIN_PASSWORD.
 * Si es válida emite la cookie de sesión firmada con HMAC.
 * No revela si el panel está deshabilitado vs. contraseña incorrecta
 * (salvo el 503 de panel-no-configurado, que es informativo).
 */
import { NextResponse } from "next/server";
import {
  adminConfigured,
  verifyPassword,
  makeSessionToken,
  ADMIN_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Panel deshabilitado: no hay ADMIN_PASSWORD configurada
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Panel deshabilitado" },
      { status: 503 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    // Mensaje genérico: no revelamos si fue contraseña mala vs. panel incorrecto
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  // Credenciales correctas: emitir cookie de sesión (httpOnly, firmada con HMAC)
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, makeSessionToken(), sessionCookieOptions());
  return response;
}
