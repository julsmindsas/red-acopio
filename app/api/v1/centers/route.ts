/**
 * Route Handler público: GET /api/v1/centers, POST /api/v1/centers
 *
 * GET  → lista los centros con filtros opcionales; responde con atribución.
 * POST → registra una recomendación ciudadana de un nuevo centro.
 * OPTIONS → respuesta de preflight CORS (204).
 *
 * CORS abierto: cualquier origen puede consumir estos endpoints.
 */
import type { ApiError, Center, MaterialCategory, VerificationStatus } from "@/lib/types";
import { MATERIAL_CATEGORIES, VERIFICATION_STATUSES } from "@/lib/types";
import { listAllCenters } from "@/lib/centers-source";
import { getRepository } from "@/lib/db";
import { centerInputSchema, formatZodErrors } from "@/lib/validation";
import { corsHeaders, json } from "@/lib/cors";

// Siempre dinámico: los datos cambian frecuentemente.
export const dynamic = "force-dynamic";

/** Mensaje de atribución que acompaña todas las respuestas de listado. */
const ATTRIBUTION =
  "Centros verificados de acopiove.org (terremotovenezuela.app) combinados con aportes locales de Red de Acopio.";

// ---------------------------------------------------------------------------
// GET /api/v1/centers
// ---------------------------------------------------------------------------

/**
 * Parámetros de filtrado soportados:
 *   - source:   "all" | "official" | "local"   (defecto: "all")
 *   - city:     cadena libre, comparación insensible a mayúsculas.
 *   - material: una MaterialCategory válida.
 *   - status:   un VerificationStatus válido.
 *   - q:        búsqueda de texto en nombre y dirección (insensible a mayúsculas).
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);

    // Leer y normalizar los parámetros de consulta.
    const sourceParam = searchParams.get("source") ?? "all";
    const cityParam   = searchParams.get("city")?.trim().toLowerCase() ?? "";
    const materialParam = searchParams.get("material") ?? "";
    const statusParam   = searchParams.get("status") ?? "";
    const qParam        = searchParams.get("q")?.trim().toLowerCase() ?? "";

    // Validar "source": sólo se aceptan los valores definidos.
    if (sourceParam !== "all" && sourceParam !== "official" && sourceParam !== "local") {
      return json(
        {
          error: `Parámetro "source" inválido. Valores aceptados: all, official, local.`,
        } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validar "material" si viene.
    if (materialParam && !(MATERIAL_CATEGORIES as readonly string[]).includes(materialParam)) {
      return json(
        {
          error: `Parámetro "material" inválido. Valores aceptados: ${MATERIAL_CATEGORIES.join(", ")}.`,
        } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validar "status" si viene.
    if (statusParam && !(VERIFICATION_STATUSES as readonly string[]).includes(statusParam)) {
      return json(
        {
          error: `Parámetro "status" inválido. Valores aceptados: ${VERIFICATION_STATUSES.join(", ")}.`,
        } satisfies ApiError,
        { status: 400 },
      );
    }

    // Obtener los centros combinados (oficiales + locales deduplicados).
    let items: Center[] = await listAllCenters();

    // Filtrar por fuente.
    if (sourceParam === "official") {
      items = items.filter((c) => c.source === "acopiove.org" || c.readOnly === true);
    } else if (sourceParam === "local") {
      items = items.filter((c) => c.source !== "acopiove.org" && !c.readOnly);
    }

    // Filtrar por ciudad (insensible a mayúsculas).
    if (cityParam) {
      items = items.filter(
        (c) => c.city?.toLowerCase().includes(cityParam) || c.address.toLowerCase().includes(cityParam),
      );
    }

    // Filtrar por material.
    if (materialParam) {
      const mat = materialParam as MaterialCategory;
      items = items.filter((c) => c.materials.includes(mat));
    }

    // Filtrar por estado de verificación.
    if (statusParam) {
      const st = statusParam as VerificationStatus;
      items = items.filter((c) => c.status === st);
    }

    // Búsqueda de texto libre en nombre y dirección.
    if (qParam) {
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(qParam) ||
          c.address.toLowerCase().includes(qParam),
      );
    }

    return json({ attribution: ATTRIBUTION, total: items.length, items });
  } catch (err) {
    console.error("[GET /api/v1/centers]", err);
    return json(
      { error: "Error interno al obtener los centros." } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/centers
// ---------------------------------------------------------------------------

/**
 * Registra una recomendación ciudadana de un nuevo centro de acopio.
 *
 * Body esperado (JSON): CenterInput
 * Respuestas:
 *   201 → Center creado.
 *   400 → Datos inválidos; incluye errores por campo.
 *   503 → Almacenamiento de sólo lectura (deploy sin BD configurada).
 *   500 → Error interno.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const result = centerInputSchema.safeParse(body);

    if (!result.success) {
      return json(
        {
          error: "Datos inválidos",
          fields: formatZodErrors(result.error),
        } satisfies ApiError,
        { status: 400 },
      );
    }

    const center = await getRepository().create(result.data, {
      status: "reportado",
      source: "api",
    });

    return json(center, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/centers]", err);

    // Almacenamiento de sólo lectura: deploy sin base de datos configurada.
    if (err instanceof Error && err.message.startsWith("READ_ONLY_STORE")) {
      return json(
        {
          error:
            "El registro de centros no está disponible: este despliegue no tiene base de datos configurada. " +
            "Configura una base Postgres (DATABASE_URL) para habilitar los reportes.",
        } satisfies ApiError,
        { status: 503 },
      );
    }

    return json(
      { error: "Error interno al crear el centro." } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// OPTIONS /api/v1/centers  — preflight CORS
// ---------------------------------------------------------------------------

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
