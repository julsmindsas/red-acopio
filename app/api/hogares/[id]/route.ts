/**
 * PATCH  /api/hogares/[id] — actualización parcial de un hogar (panel del equipo).
 * DELETE /api/hogares/[id] — eliminación de un hogar (panel del equipo).
 *
 * Ambas rutas protegidas con la misma cookie de sesión HMAC que las rutas
 * admin de centros. En Next.js 16 los params de ruta dinámica son asíncronos.
 *
 * Nota deliberada: aunque hogarPatchSchema (derivado de hogarFieldsSchema)
 * acepta nombre/telefono/documento/direccion/ciudad, el contrato HogarPatch
 * NO los incluye — la identidad del anfitrión se fija en el registro y no se
 * edita desde el panel. Aquí validamos con el esquema y luego proyectamos
 * explícitamente a HogarPatch, descartando cualquier campo de identidad.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import type { HogarPatch } from "@/lib/hogares/types";
import { hogarPatchSchema } from "@/lib/hogares/validation";
import { getHogaresRepository } from "@/lib/hogares/store";
import { formatZodErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Comprueba si el error proviene del store de solo lectura. */
function isReadOnlyError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("READ_ONLY_STORE");
}

// ---------------------------------------------------------------------------
// PATCH — actualización parcial
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // 1. Autenticación antes de cualquier operación.
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Params asincrónicos (Next.js 16).
  const { id } = await ctx.params;

  // 3. Parsear y validar cuerpo.
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido o vacío" },
      { status: 400 },
    );
  }

  const result = hogarPatchSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", fields: formatZodErrors(result.error) },
      { status: 400 },
    );
  }

  // 4. Proyección explícita a HogarPatch: solo campos editables del contrato.
  const v = result.data;
  const patch: HogarPatch = {
    ...(v.zona !== undefined && { zona: v.zona }),
    ...(v.capacidad !== undefined && { capacidad: v.capacidad }),
    ...(v.acepta !== undefined && { acepta: v.acepta }),
    ...(v.ofrece !== undefined && { ofrece: v.ofrece }),
    ...(v.duracion !== undefined && { duracion: v.duracion }),
    ...(v.convivencia !== undefined && { convivencia: v.convivencia }),
    ...(v.notas !== undefined && { notas: v.notas }),
    ...(v.disponibilidad !== undefined && { disponibilidad: v.disponibilidad }),
    ...(v.verificacion !== undefined && { verificacion: v.verificacion }),
  };

  // 5. Actualizar en el repositorio.
  try {
    const updated = await getHogaresRepository().updateHogar(id, patch);
    if (updated === null) {
      return NextResponse.json({ error: "Hogar no encontrado" }, { status: 404 });
    }
    // Es una ruta autenticada del equipo: devuelve el registro completo.
    return NextResponse.json(updated);
  } catch (err) {
    if (isReadOnlyError(err)) {
      return NextResponse.json(
        { error: "Almacenamiento de solo lectura; configura Postgres." },
        { status: 503 },
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// DELETE — eliminación
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // 1. Autenticación antes de cualquier operación.
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Params asincrónicos (Next.js 16).
  const { id } = await ctx.params;

  // 3. Eliminar del repositorio.
  try {
    const deleted = await getHogaresRepository().removeHogar(id);
    if (!deleted) {
      return NextResponse.json({ error: "Hogar no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isReadOnlyError(err)) {
      return NextResponse.json(
        { error: "Almacenamiento de solo lectura; configura Postgres." },
        { status: 503 },
      );
    }
    throw err;
  }
}
