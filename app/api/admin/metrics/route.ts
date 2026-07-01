/**
 * GET /api/admin/metrics — métricas de uso para el panel administrativo.
 *
 * Protegido por la cookie de sesión del admin (igual que el resto de /api/admin).
 * Devuelve totales, reportes por día y centros más consultados.
 */
import type { NextRequest } from "next/server";
import type { ApiError } from "@/lib/types";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { getAdminMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return Response.json(
      { error: "No autorizado" } satisfies ApiError,
      { status: 401 },
    );
  }

  try {
    const metrics = await getAdminMetrics();
    return Response.json(metrics);
  } catch (err) {
    console.error("[GET /api/admin/metrics]", err);
    return Response.json(
      { error: "Error al calcular las métricas." } satisfies ApiError,
      { status: 500 },
    );
  }
}
