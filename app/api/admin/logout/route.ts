/**
 * POST /api/admin/logout
 *
 * Cierra la sesión del administrador borrando la cookie de sesión.
 * Siempre responde 200 aunque el usuario no estuviera autenticado.
 */
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // Borra la cookie sobreescribiéndola con maxAge: 0
  response.cookies.set(ADMIN_COOKIE, "", { maxAge: 0 });
  return response;
}
