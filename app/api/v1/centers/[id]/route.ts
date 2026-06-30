/**
 * Route Handler público: GET /api/v1/centers/[id]
 *
 * GET     → devuelve el centro con el id dado (busca en la fuente híbrida).
 * OPTIONS → respuesta de preflight CORS (204).
 *
 * IMPORTANTE (Next.js 16): los `params` de rutas dinámicas son una Promesa
 * y deben esperarse con `await` antes de desestructurar.
 *
 * Se busca primero en `listAllCenters()` (fuente híbrida: oficiales + locales
 * deduplicados) para que los centros de acopiove.org, cuyos ids comienzan por
 * "acopio-", sean resolvibles correctamente.
 */
import type { ApiError } from "@/lib/types";
import { listAllCenters } from "@/lib/centers-source";
import { corsHeaders, json } from "@/lib/cors";

// Sin caché: los datos pueden cambiar en cualquier momento.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/v1/centers/[id]
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await ctx.params;

    // Buscamos en la fuente híbrida para incluir centros oficiales ("acopio-...")
    // y locales no duplicados.
    const all = await listAllCenters();
    const center = all.find((c) => c.id === id) ?? null;

    if (!center) {
      return json(
        { error: `No se encontró un centro con id "${id}".` } satisfies ApiError,
        { status: 404 },
      );
    }

    return json(center);
  } catch (err) {
    console.error("[GET /api/v1/centers/[id]]", err);
    return json(
      { error: "Error interno al buscar el centro." } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// OPTIONS /api/v1/centers/[id]  — preflight CORS
// ---------------------------------------------------------------------------

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
