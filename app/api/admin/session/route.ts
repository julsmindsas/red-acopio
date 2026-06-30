/**
 * GET /api/admin/session
 *
 * Devuelve el estado de configuración y autenticación del panel admin.
 * Respuesta: { configured: boolean; authenticated: boolean }
 *
 * Útil para que la UI decida qué mostrar al cargar (sin login, con login, sin panel).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  adminConfigured,
  verifySessionToken,
  ADMIN_COOKIE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return NextResponse.json({
    configured: adminConfigured(),
    authenticated: verifySessionToken(token),
  });
}
