/**
 * Service worker de Red de Acopio.
 *
 * POR QUÉ EXISTE
 * --------------
 * Tras un sismo, la red móvil es lo primero que se cae o se congestiona. Quien
 * más necesita saber dónde está el albergue más cercano suele ser quien peor
 * señal tiene. Este worker hace que la app **abra y muestre los últimos puntos
 * conocidos aunque no haya conexión**.
 *
 * ESTRATEGIAS
 * -----------
 *   - Navegaciones (HTML): red primero, con respaldo a la última copia en caché.
 *     Así nadie ve datos viejos cuando sí hay red.
 *   - `/api/v1/centers`: red primero y, si responde, se guarda una copia. Sin
 *     red, se sirve la última copia buena con la cabecera `X-Red-Acopio-Offline`
 *     para que la interfaz pueda avisar de que son datos guardados.
 *   - Estáticos del build (`/_next/static`) e iconos: caché primero (son
 *     inmutables y con hash en el nombre).
 *
 * Sin dependencias ni build step: es JavaScript plano servido desde /public.
 */

const VERSION = "v1";
const SHELL_CACHE = `red-acopio-shell-${VERSION}`;
const DATA_CACHE = `red-acopio-data-${VERSION}`;

/** Rutas que se precargan al instalar, para garantizar un arranque sin red. */
const SHELL_URLS = ["/mapa", "/ayuda", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // `reload` evita guardar una copia ya rancia del propio navegador.
      // Si alguna URL falla, no se aborta la instalación completa.
      await Promise.allSettled(
        SHELL_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Borra cachés de versiones anteriores del worker.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("red-acopio-") && k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/** ¿Es la petición de datos de puntos que queremos conservar offline? */
function isCentersApi(url) {
  return url.pathname.startsWith("/api/v1/centers");
}

/** ¿Es un estático inmutable del build o un icono? */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname === "/manifest.webmanifest"
  );
}

/** Red primero; si falla, la última copia guardada. */
async function networkFirst(request, cacheName, { markOffline = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Solo se cachean respuestas correctas: nunca un 500 ni un 404.
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (!cached) throw new Error("Sin red y sin copia en caché");

    if (!markOffline) return cached;

    // Marca la respuesta para que la interfaz sepa que son datos guardados.
    const headers = new Headers(cached.headers);
    headers.set("X-Red-Acopio-Offline", "1");
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }
}

/** Caché primero (para recursos inmutables). */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET del mismo origen: los POST (reportes ciudadanos) deben ir a la red
  // siempre, y nunca interceptamos peticiones a terceros.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cachear el área administrativa ni sus endpoints.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
    return;
  }

  if (isCentersApi(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE, { markOffline: true }));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(async () => {
        // Última red de seguridad: el mapa, que es lo que la gente necesita.
        const cache = await caches.open(SHELL_CACHE);
        return (
          (await cache.match("/mapa")) ??
          new Response(
            "<!doctype html><meta charset=utf-8><title>Sin conexión</title>" +
              "<body style='font-family:system-ui;padding:2rem;line-height:1.5'>" +
              "<h1>Sin conexión</h1><p>Abre la app una vez con internet para " +
              "guardar los puntos y poder consultarlos sin red.</p>" +
              "<p>Si es una emergencia, llama al <a href='tel:123'>123</a>.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          )
        );
      }),
    );
  }
});
