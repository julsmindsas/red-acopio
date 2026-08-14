/**
 * Route Handler: /api/hogares/solicitudes
 *
 * POST → registro público de una solicitud de hospedaje.
 * GET  → todas las solicitudes, SOLO para el equipo coordinador (cookie admin).
 *
 * Las solicitudes son enteramente privadas: quien necesita techo nunca aparece
 * en ninguna lista pública. Por eso el POST responde apenas con
 * { id, estado, createdAt } — suficiente para que la persona guarde su número
 * de radicado, sin eco de sus datos personales.
 */
import type { NextRequest } from "next/server";
import type { ApiError } from "@/lib/types";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { solicitudInputSchema } from "@/lib/hogares/validation";
import { getHogaresRepository } from "@/lib/hogares/store";
import { formatZodErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/hogares/solicitudes — todas las solicitudes (solo equipo). */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return Response.json(
      { error: "No autorizado" } satisfies ApiError,
      { status: 401 },
    );
  }

  try {
    const solicitudes = await getHogaresRepository().listSolicitudes();
    return Response.json(solicitudes);
  } catch (err) {
    console.error("[GET /api/hogares/solicitudes]", err);
    return Response.json(
      { error: "Error interno al obtener las solicitudes." } satisfies ApiError,
      { status: 500 },
    );
  }
}

/**
 * POST /api/hogares/solicitudes — crea una solicitud de hospedaje.
 *
 * Body esperado (JSON): SolicitudInput.
 * Respuestas:
 *   201 → { id, estado, createdAt } (nada más: la solicitud es privada).
 *   400 → Datos inválidos; incluye campos con errores.
 *   503 → Almacenamiento de solo lectura (deploy sin base de datos).
 *   500 → Error interno.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = solicitudInputSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Datos inválidos",
          fields: formatZodErrors(result.error),
        } satisfies ApiError,
        { status: 400 },
      );
    }

    // El store fija estado "nueva"; el equipo la toma desde su panel.
    const solicitud = await getHogaresRepository().createSolicitud(result.data);

    return Response.json(
      {
        id: solicitud.id,
        estado: solicitud.estado,
        createdAt: solicitud.createdAt,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/hogares/solicitudes]", err);

    if (err instanceof Error && err.message.startsWith("READ_ONLY_STORE")) {
      return Response.json(
        {
          error:
            "El registro de solicitudes no está disponible: este despliegue no tiene base de datos configurada. " +
            "Configura una base Postgres (DATABASE_URL) para habilitar Hogares de Paso.",
        } satisfies ApiError,
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Error interno al registrar la solicitud." } satisfies ApiError,
      { status: 500 },
    );
  }
}
