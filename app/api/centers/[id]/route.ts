/**
 * Route Handler: /api/centers/[id]
 *
 * GET → devuelve el centro con el id dado, o 404 si no existe.
 *
 * IMPORTANTE (Next.js 16): los `params` de rutas dinámicas son una Promesa
 * y deben esperarse con `await` antes de desestructurar.
 */
import type { ApiError } from "@/lib/types";
import { getRepository } from "@/lib/db";

// Sin caché para que siempre refleje el estado actual del store.
export const dynamic = "force-dynamic";

/** GET /api/centers/[id] */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const center = await getRepository().getById(id);

    if (!center) {
      return Response.json(
        { error: `No se encontró un centro con id "${id}".` } satisfies ApiError,
        { status: 404 },
      );
    }

    return Response.json(center);
  } catch (err) {
    console.error("[GET /api/centers/[id]]", err);
    return Response.json(
      { error: "Error interno al buscar el centro." } satisfies ApiError,
      { status: 500 },
    );
  }
}
