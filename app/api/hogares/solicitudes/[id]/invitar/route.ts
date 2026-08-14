/**
 * POST /api/hogares/solicitudes/[id]/invitar — lanza la subasta desde el panel.
 *
 * Es el acceso del administrador al mismo mecanismo automático: en vez de
 * emparejar a dedo (que dejaba al anfitrión sin voz), el equipo le PIDE la
 * aprobación a los hogares compatibles. Sirve para relanzar una ronda cuando
 * nadie respondió, o para preguntarle a una casa puntual acordada por teléfono.
 *
 * Body opcional: { hogarId } para invitar a un hogar concreto; sin él, invita
 * a la siguiente tanda de compatibles que aún no han sido invitados.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { getHogaresRepository } from "@/lib/hogares/store";
import { invitarHogares } from "@/lib/hogares/subasta";
import { enlacesHabilitados } from "@/lib/hogares/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let hogarId: string | null = null;
  try {
    const body = (await req.json()) as { hogarId?: string };
    hogarId = typeof body?.hogarId === "string" ? body.hogarId : null;
  } catch {
    // Sin cuerpo: ronda general. No es un error.
  }

  if (!enlacesHabilitados()) {
    return NextResponse.json(
      {
        error:
          "No hay secreto de firma configurado (ADMIN_SESSION_SECRET); sin él no se pueden emitir enlaces de aprobación.",
      },
      { status: 503 },
    );
  }

  try {
    const repo = getHogaresRepository();
    const solicitudes = await repo.listSolicitudes();
    const solicitud = solicitudes.find((s) => s.id === id);
    if (!solicitud) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 },
      );
    }
    if (solicitud.estado !== "nueva" && solicitud.estado !== "en_proceso") {
      return NextResponse.json(
        {
          error:
            "Esta solicitud ya fue conectada o cerrada; no admite más invitaciones.",
        },
        { status: 409 },
      );
    }

    const resultado = await invitarHogares(repo, solicitud, { hogarId });
    return NextResponse.json(resultado);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("READ_ONLY_STORE")) {
      return NextResponse.json(
        { error: "Almacenamiento de solo lectura; configura Postgres." },
        { status: 503 },
      );
    }
    console.error("[POST invitar]", err);
    return NextResponse.json(
      { error: "Error interno al invitar hogares." },
      { status: 500 },
    );
  }
}
