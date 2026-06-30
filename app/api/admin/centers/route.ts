/**
 * GET /api/admin/centers
 *
 * Lista todos los centros almacenados localmente (no externos/readOnly).
 * Ruta protegida: requiere cookie de sesión válida.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { getRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verificación de sesión antes de cualquier operación
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const centers = await getRepository().list();
  return NextResponse.json(centers);
}
