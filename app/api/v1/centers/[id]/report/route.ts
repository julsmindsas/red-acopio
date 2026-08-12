/**
 * POST /api/v1/centers/{id}/report — reporte comunitario del estado de un punto.
 *
 * Sin registro ni datos personales: quien acaba de pasar por el sitio dice en un
 * toque si sigue abierto, si está lleno o si ya cerró. Es la información que más
 * rápido caduca y la que ninguna redacción puede mantener al día.
 *
 * Anti-abuso: un mismo dispositivo solo puede reportar el mismo punto una vez
 * por hora, identificado por un hash con sal (nunca se guarda la IP).
 */
import type { NextRequest } from "next/server";
import { REPORTABLE_STATUSES } from "@/lib/types";
import type { ApiError, OperationalStatus } from "@/lib/types";
import { addReport, reporterHash } from "@/lib/db/reports";
import { corsHeaders, json } from "@/lib/cors";

export const dynamic = "force-dynamic";

/** IP del cliente detrás del proxy de Vercel. */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "desconocida";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(
      { error: "Cuerpo de la solicitud inválido o vacío." } satisfies ApiError,
      { status: 400 },
    );
  }

  const status = (body as { status?: string })?.status;
  if (!status || !(REPORTABLE_STATUSES as readonly string[]).includes(status)) {
    return json(
      {
        error: `Parámetro "status" inválido. Valores aceptados: ${REPORTABLE_STATUSES.join(", ")}.`,
      } satisfies ApiError,
      { status: 400 },
    );
  }

  const hash = reporterHash(
    clientIp(req),
    req.headers.get("user-agent") ?? "desconocido",
  );

  const outcome = await addReport(id, status as OperationalStatus, hash);

  if (outcome === "cooldown") {
    return json(
      {
        error:
          "Ya reportaste este punto hace poco. Gracias: tu reporte sigue contando.",
      } satisfies ApiError,
      { status: 429 },
    );
  }

  if (outcome === "unavailable") {
    return json(
      {
        error:
          "Los reportes comunitarios no están disponibles en este despliegue (falta base de datos).",
      } satisfies ApiError,
      { status: 503 },
    );
  }

  return json({ ok: true, centerId: id, status }, { status: 201 });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
