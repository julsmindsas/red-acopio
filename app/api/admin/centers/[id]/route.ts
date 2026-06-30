/**
 * PATCH /api/admin/centers/[id]   — Actualización parcial de un centro.
 * DELETE /api/admin/centers/[id]  — Eliminación de un centro.
 *
 * Ambas rutas están protegidas con cookie de sesión HMAC.
 * En Next.js 16 los params de ruta dinámica son asíncronos.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { centerInputSchema, formatZodErrors } from "@/lib/validation";
import { MATERIAL_CATEGORIES, VERIFICATION_STATUSES } from "@/lib/types";
import type { CenterPatch } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Esquema de validación para PATCH (todos los campos opcionales)
// Extiende centerInputSchema.partial() con los campos exclusivos del panel admin.
// ---------------------------------------------------------------------------
const centerPatchSchema = centerInputSchema.partial().extend({
  city:    z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  status:  z.enum(VERIFICATION_STATUSES).optional(),
});

// Tipado inferido compatible con CenterPatch
type PatchInput = z.infer<typeof centerPatchSchema>;

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
  // 1. Autenticación: verificar cookie antes de cualquier operación
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Params asincrónicos (Next.js 16)
  const { id } = await ctx.params;

  // 3. Parsear y validar cuerpo
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido o vacío" },
      { status: 400 },
    );
  }

  const result = centerPatchSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", fields: formatZodErrors(result.error) },
      { status: 400 },
    );
  }

  const patch: CenterPatch = result.data as PatchInput;

  // 4. Actualizar en el repositorio
  try {
    const updated = await getRepository().update(id, patch);
    if (updated === null) {
      return NextResponse.json({ error: "Centro no encontrado" }, { status: 404 });
    }
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
  // 1. Autenticación: verificar cookie antes de cualquier operación
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Params asincrónicos (Next.js 16)
  const { id } = await ctx.params;

  // 3. Eliminar del repositorio
  try {
    const deleted = await getRepository().remove(id);
    if (!deleted) {
      return NextResponse.json({ error: "Centro no encontrado" }, { status: 404 });
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
