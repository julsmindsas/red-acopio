/**
 * Route Handler: /api/hogares
 *
 * GET  → lista pública de hogares de paso: no rechazados y disponibles,
 *        SIEMPRE proyectados con toHogarPublico() (sin nombre, teléfono,
 *        documento ni dirección).
 * GET ?todos=1 → lista completa con datos privados, exclusiva del panel de
 *        coordinación (cookie de sesión admin, igual que /api/admin/centers).
 * POST → registro público de un hogar. Entra como "pendiente" y se publica de
 *        inmediato con esa etiqueta (plataforma de intermediación: no hay
 *        proceso de verificación previo).
 *
 * Ref: Next.js 16 Route Handlers — app router, archivo route.ts.
 * Sin CORS abierto: igual que /api/centers, este endpoint es interno de la app.
 */
import type { NextRequest } from "next/server";
import type { ApiError } from "@/lib/types";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { toHogarPublico } from "@/lib/hogares/types";
import { hogarInputSchema } from "@/lib/hogares/validation";
import { getHogaresRepository } from "@/lib/hogares/store";
import { formatZodErrors } from "@/lib/validation";

// La disponibilidad de los hogares cambia a cada rato; nada de caché.
export const dynamic = "force-dynamic";

/**
 * GET /api/hogares
 *
 * Público: hogares verificados y activos, sanitizados.
 * Con ?todos=1 y sesión admin: hogares completos (panel del equipo).
 */
export async function GET(req: NextRequest) {
  try {
    const quiereTodos = req.nextUrl.searchParams.get("todos") === "1";

    if (quiereTodos) {
      // Vista del equipo coordinador: exige la misma cookie de sesión HMAC
      // que las rutas admin de centros. Sin sesión, 401 — jamás degradamos
      // silenciosamente a la vista pública, para que un panel mal autenticado
      // falle ruidosamente en vez de mostrar datos incompletos.
      const token = req.cookies.get(ADMIN_COOKIE)?.value;
      if (!verifySessionToken(token)) {
        return Response.json(
          { error: "No autorizado" } satisfies ApiError,
          { status: 401 },
        );
      }
      const hogares = await getHogaresRepository().listHogares();
      return Response.json(hogares);
    }

    // Vista pública: el filtro (no rechazado + disponible) y la proyección
    // toHogarPublico son el contrato de seguridad de todo el dominio. La
    // plataforma es de intermediación: los hogares se publican de inmediato
    // con su estado de verificación real (la tarjeta lo etiqueta). Los
    // "ocupado" NO se publican: zona + convivencia + "está hospedando ahora"
    // le diría a un observador dónde vive gente vulnerable hoy.
    const hogares = await getHogaresRepository().listHogares();
    const publicos = hogares
      .filter(
        (h) =>
          h.verificacion !== "rechazado" && h.disponibilidad === "disponible",
      )
      .map(toHogarPublico);
    return Response.json(publicos);
  } catch (err) {
    console.error("[GET /api/hogares]", err);
    return Response.json(
      { error: "Error interno al obtener los hogares." } satisfies ApiError,
      { status: 500 },
    );
  }
}

/**
 * POST /api/hogares — registra un hogar de paso.
 *
 * Body esperado (JSON): HogarInput.
 * Respuestas:
 *   201 → { hogar: HogarPublico, mensaje } (nunca el registro completo:
 *          ni siquiera quien lo creó recibe de vuelta sus datos sensibles,
 *          así la respuesta es inofensiva en logs y devtools).
 *   400 → Datos inválidos; incluye campos con errores.
 *   503 → Almacenamiento de solo lectura (deploy sin base de datos).
 *   500 → Error interno.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = hogarInputSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Datos inválidos",
          fields: formatZodErrors(result.error),
        } satisfies ApiError,
        { status: 400 },
      );
    }

    // El store fija verificacion "pendiente" y disponibilidad "disponible".
    const hogar = await getHogaresRepository().createHogar(result.data);

    return Response.json(
      {
        hogar: toHogarPublico(hogar),
        mensaje:
          "¡Gracias por abrir tu casa! Tu hogar ya quedó publicado con la información general. Tu nombre, teléfono, documento y dirección nunca se muestran públicamente.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/hogares]", err);

    if (err instanceof Error && err.message.startsWith("READ_ONLY_STORE")) {
      return Response.json(
        {
          error:
            "El registro de hogares no está disponible: este despliegue no tiene base de datos configurada. " +
            "Configura una base Postgres (DATABASE_URL) para habilitar Hogares de Paso.",
        } satisfies ApiError,
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Error interno al registrar el hogar." } satisfies ApiError,
      { status: 500 },
    );
  }
}
