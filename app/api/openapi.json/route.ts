/**
 * Route Handler: GET /api/openapi.json
 *
 * Expone la especificación OpenAPI 3.1 de la API pública como JSON.
 * Incluye cabeceras CORS para que visores de documentación (Swagger UI,
 * Redoc, Scalar…) alojados en cualquier origen puedan consumirla.
 *
 * No contiene datos sensibles: puede servirse con caché estático.
 */
import { openapiSpec } from "@/lib/openapi";
import { json } from "@/lib/cors";

// La especificación no cambia en tiempo de ejecución; puede cachearse.
export const dynamic = "force-dynamic";

/** GET /api/openapi.json */
export async function GET(): Promise<Response> {
  return json(openapiSpec);
}
