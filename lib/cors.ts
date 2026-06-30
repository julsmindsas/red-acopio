/**
 * Helpers CORS para los endpoints públicos de la API v1.
 *
 * CORS abierto SÓLO para /api/v1/** y /api/openapi.json.
 * Los endpoints admin (/api/admin/**) y el interno (/api/centers)
 * NO deben importar este módulo.
 */

/** Cabeceras CORS estándar para la API pública de lectura. */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * Envuelve `Response.json` añadiendo las cabeceras CORS.
 * Úsalo en lugar de `Response.json` en todos los handlers de la API pública
 * para garantizar que cada respuesta lleve los headers correctos.
 *
 * @param data   - Datos a serializar como JSON.
 * @param init   - Opciones adicionales de Response (status, headers extra…).
 */
export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return Response.json(data, { ...init, headers });
}
