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
import { after } from "next/server";
import type { ApiError } from "@/lib/types";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { solicitudInputSchema } from "@/lib/hogares/validation";
import { getHogaresRepository } from "@/lib/hogares/store";
import {
  baseUrl,
  correoNuevaSolicitud,
  crearToken,
  enlacesHabilitados,
  enviarCorreo,
} from "@/lib/hogares/email";
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
    const repo = getHogaresRepository();
    const solicitud = await repo.createSolicitud(result.data);

    // Si la solicitud señaló un hogar concreto, se le avisa a ese anfitrión
    // por correo con un enlace firmado para aceptar o rechazar. Mejor
    // esfuerzo: un fallo de correo jamás tumba el registro de la solicitud.
    if (solicitud.hogarInteresId && enlacesHabilitados()) {
      try {
        const hogar = await repo.getHogarById(solicitud.hogarInteresId);
        if (
          hogar?.email &&
          hogar.verificacion !== "rechazado" &&
          hogar.disponibilidad === "disponible"
        ) {
          const token = crearToken(
            { acc: "responder", hid: hogar.id, sid: solicitud.id },
            14,
          );
          const url = `${baseUrl()}/hogares/respuesta?token=${encodeURIComponent(token)}`;
          const correo = correoNuevaSolicitud(hogar, solicitud, url);
          const destinatario = hogar.email;
          // after(): garantiza el envío tras la respuesta (serverless).
          after(() => enviarCorreo({ to: destinatario, ...correo }));
        }
      } catch (err) {
        console.error("[POST /api/hogares/solicitudes] aviso al anfitrión", err);
      }
    }

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
