/**
 * Route Handler: /api/centers
 *
 * GET  → lista todos los centros de acopio.
 * POST → crea un nuevo centro a partir de los datos enviados por el ciudadano.
 *
 * Ref: Next.js 16 Route Handlers — app router, archivo route.ts
 */
import type { ApiError } from "@/lib/types";
import { centerInputSchema, formatZodErrors } from "@/lib/validation";
import { getRepository } from "@/lib/db";

// Los datos de centros cambian con frecuencia; deshabilitamos el caché.
export const dynamic = "force-dynamic";

/** GET /api/centers — devuelve todos los centros ordenados por fecha de creación. */
export async function GET() {
  try {
    const centers = await getRepository().list();
    return Response.json(centers);
  } catch (err) {
    console.error("[GET /api/centers]", err);
    return Response.json(
      { error: "Error interno al obtener los centros." } satisfies ApiError,
      { status: 500 },
    );
  }
}

/**
 * POST /api/centers — crea un nuevo centro.
 *
 * Body esperado (JSON): CenterInput
 * Respuestas:
 *   201 → Center creado.
 *   400 → Datos inválidos; incluye campos con errores.
 *   500 → Error interno.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = centerInputSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Datos inválidos",
          fields: formatZodErrors(result.error),
        } satisfies ApiError,
        { status: 400 },
      );
    }

    const center = await getRepository().create(result.data, {
      status: "reportado",
      source: "reporte-ciudadano",
    });

    return Response.json(center, { status: 201 });
  } catch (err) {
    console.error("[POST /api/centers]", err);
    return Response.json(
      { error: "Error interno al crear el centro." } satisfies ApiError,
      { status: 500 },
    );
  }
}
