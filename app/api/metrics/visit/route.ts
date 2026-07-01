/**
 * POST /api/metrics/visit — registra una consulta a un centro.
 *
 * Lo llama la UI (fire-and-forget) cuando alguien pulsa "Cómo llegar" o "Llamar",
 * para alimentar la métrica de "centros más consultados". Público y a prueba de
 * fallos: siempre responde 200 y nunca rompe la experiencia del usuario.
 */
import { recordVisit } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      centerId?: unknown;
      centerName?: unknown;
    };
    const centerId = typeof body.centerId === "string" ? body.centerId : "";
    const centerName =
      typeof body.centerName === "string" ? body.centerName : "";

    if (centerId && centerName) {
      // Acota el nombre por seguridad/tamaño.
      await recordVisit(centerId, centerName.slice(0, 200));
    }
  } catch {
    // Ignoramos errores: la métrica nunca debe afectar al usuario.
  }
  return Response.json({ ok: true });
}
