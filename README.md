# Red de Acopio 🧭🤝

Aplicación web **mobile-first** para encontrar **puntos de ayuda humanitaria** cerca de ti: albergues, centros de acopio, brigadas médicas y puntos de agua.

> **🚨 Emergencia activa: sismo de Colombia del 10 de agosto de 2026.**
> Magnitud **7,4**, epicentro en **San José del Palmar (Chocó)**, 07:34 (hora de Bogotá). Afectación grave en **Manizales**, **Pereira**, **Armenia**, **Cali** y **Quibdó**.
> La app está reorientada a esta emergencia; los datos de la anterior (terremotos de Venezuela, junio de 2026) quedan archivados en `data/centers.venezuela-2026.json`.

La aplicación es **genérica y reutilizable** para cualquier ciudad o emergencia: cambiar de evento es editar `EMERGENCY` y `AFFECTED_CITIES` en `lib/constants.ts`, sembrar datos nuevos y apuntar los scrapers a otras fuentes.

> **⚠️ Nota de responsabilidad sobre los datos**
> Esta es una herramienta humanitaria real. Una dirección o teléfono equivocados envían personas a lugares equivocados. Por eso:
> - Cada centro tiene un **estado de verificación** (`verificado`, `sin_verificar`, `reportado`) que la interfaz muestra siempre.
> - Los datos de ejemplo y los scrapeados se marcan como **`sin_verificar`** con un aviso explícito de confirmar antes de acudir.
> - El proyecto **no inventa** centros: el scraper solo registra lo hallado en fuentes públicas, citando la URL de origen (ver [`docs/fuentes.md`](docs/fuentes.md)).

---

## ✨ Funcionalidades

- 🙋 **Entrada por intención**: un toque para "busco dónde dormir", "necesito atención o agua" o "quiero donar". Los filtros finos quedan plegados para no abrumar a quien acaba de vivir un sismo.
- 🏠 **Cuatro tipos de punto**: albergue, centro de acopio, brigada médica y punto de agua (campo `kind`).
- 🟠 **Estado operativo** (`recibiendo` · `saturado` · `cerrado`) más **"urge"** y **"no llevar"** por punto: evita el colapso logístico de que todo el mundo lleve lo mismo a un sitio ya lleno.
- 📍 **Geolocalización** del usuario y **mapa multi-ciudad**: abre en la ciudad afectada más cercana a quien lo consulta, con selector manual.
- 🗺️ **Mapa interactivo** con **Leaflet + OpenStreetMap**; los pines combinan color (verificación) e icono (tipo de punto).
- 🔁 **Fallback automático a Google Maps** si los *tiles* de OSM fallan al cargar (requiere API key opcional).
- 📏 **Ordenamiento por distancia** (fórmula de Haversine) al usuario.
- 🚨 **Página `/ayuda`** con canales oficiales (línea 123, UNGRD, Cruz Roja, búsqueda de familiares), cada uno marcado según se haya podido **confirmar en el sitio oficial** de la organización.
- 📴 **PWA offline**: instalable y con service worker que guarda los últimos puntos, para zonas con la red caída. Avisa en pantalla cuando muestra datos guardados.
- 📝 **Recomendar un punto**: formulario ciudadano con validación (cliente + servidor) compartida vía `zod`.
- 🛠️ **Panel administrativo** (`/admin`) para aprobar recomendaciones, marcar saturación y actualizar necesidades urgentes.
- 🔌 **API pública** (`/api/v1`) con CORS y **OpenAPI 3.1** — cualquiera puede consumirla. Docs en **`/api-docs`**.
- 🗃️ **Base de datos simple e intercambiable** (JSON local en desarrollo, Postgres/Neon en producción).
- 🌐 **Scraper modular** de fuentes públicas, con monitor de portales oficiales que avisa cuando publican puntos nuevos.

---

## 🧱 Stack

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript** |
| Estilos | **Tailwind CSS v4** (mobile-first) |
| Mapa | **Leaflet** + OpenStreetMap, con *fallback* a **Google Maps** |
| Validación | **zod** (esquema compartido cliente/servidor) |
| Base de datos | **JSON local** (dev) · **Postgres/Neon** (prod) — patrón *Repository* intercambiable |
| Scraping | **cheerio** + `fetch`, geocodificación con Nominatim (OSM) |
| Deploy | **Vercel** |

---

## 📁 Estructura del proyecto

```
red-acopio/
├── app/
│   ├── layout.tsx              # Layout raíz (es, metadata, PWA, service worker)
│   ├── page.tsx                # Portada (landing) con entrada por intención
│   ├── mapa/page.tsx           # Mapa de puntos; lee ?necesito= y ?material=
│   ├── ayuda/page.tsx          # Canales oficiales (123, UNGRD, Cruz Roja, RCF)
│   ├── reportar/page.tsx       # Página del formulario de reporte
│   ├── globals.css             # Tema Tailwind v4 (paleta humanitaria)
│   └── api/
│       └── centers/
│           ├── route.ts        # GET (lista) y POST (crear) centros
│           └── [id]/route.ts   # GET centro por id
├── components/
│   ├── HomeView.tsx            # Orquesta mapa + lista + geolocalización + filtros (cliente)
│   ├── CenterList.tsx          # Lista de centros ordenados por distancia
│   ├── CenterCard.tsx          # Tarjeta de un centro
│   ├── ReportForm.tsx          # Formulario de reporte con validación
│   ├── FilterBar.tsx           # Filtros (material/estado) — punto de extensión
│   ├── Header.tsx              # Encabezado
│   └── map/                    # MÓDULO DE MAPA (proveedor intercambiable)
│       ├── MapView.tsx         # Componente público: Leaflet con fallback a Google
│       ├── LeafletMap.tsx      # Implementación Leaflet + OSM
│       ├── GoogleMap.tsx       # Implementación Google Maps
│       └── useMapProvider.ts   # Hook que decide el proveedor
├── lib/
│   ├── types.ts                # Contratos: Center, PointKind, OperationalStatus, etc.
│   ├── constants.ts            # EMERGENCY, AFFECTED_CITIES, etiquetas y metadatos
│   ├── intents.ts              # Intenciones de entrada (compartidas cliente/servidor)
│   ├── emergency-help.ts       # Canales oficiales, con su fuente y si están confirmados
│   ├── center-normalize.ts     # Rellena kind/operational en datos previos al sismo
│   ├── geo.ts                  # Haversine, ciudad más cercana, formatear distancia
│   ├── validation.ts           # Esquema zod compartido
│   └── db/
│       ├── repository.ts       # Interfaz CenterRepository (el "contrato" de datos)
│       ├── jsonStore.ts        # Implementación con archivo JSON (desarrollo)
│       ├── postgresStore.ts    # Implementación con Postgres/Neon (producción)
│       └── index.ts            # getRepository(): elige el store según el entorno
├── scripts/
│   ├── scrape.ts               # Orquestador del scraper (npm run scrape)
│   ├── seed-db.ts              # Siembra Postgres desde la semilla (npm run seed)
│   └── sources/                # Adaptadores de fuentes (pluggable)
├── public/
│   ├── sw.js                   # Service worker: la app abre y muestra puntos sin red
│   └── manifest.webmanifest    # PWA instalable, con accesos directos por intención
├── data/
│   ├── centers.seed.json       # Semilla versionada (datos de ejemplo/curados)
│   ├── centers.venezuela-2026.json  # Archivo de la emergencia anterior
│   ├── centers.local.json      # Store local mutable (git-ignored)
│   └── scraped/                # Salida cruda del scraper (git-ignored)
├── docs/
│   └── fuentes.md              # Fuentes consultadas por el scraper (transparencia)
└── .env.example                # Variables de entorno
```

> **Arquitectura modular:** la app habla con la base de datos solo a través de `CenterRepository`, y con el mapa solo a través de `<MapView/>`. Cambiar de Postgres a Firestore, o de Leaflet a otro mapa, no toca la UI. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🚀 Puesta en marcha (local)

Requisitos: **Node.js 20+** y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar en desarrollo (¡no requiere configurar nada!)
npm run dev
```

Abre **http://localhost:3000**. Sin variables de entorno, la app usa el **store JSON local** (`data/centers.local.json`, sembrado automáticamente desde `data/centers.seed.json`). Perfecto para desarrollar sin base de datos.

### Variables de entorno (opcionales)

Copia `.env.example` a `.env.local` y completa lo que necesites:

| Variable | Para qué sirve |
|----------|----------------|
| `DATABASE_URL` / `POSTGRES_URL` | Conexión a Postgres/Neon. **Si está vacía, se usa el store JSON local.** |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API key de Google Maps para el *fallback* del mapa. **Si está vacía, la app se queda en Leaflet/OSM** (no falla). |
| `ACOPIO_API_ENABLED` | Reactiva la fuente externa `acopiove.org` (`"true"`). **Apagada por defecto**: sus puntos recogen ayuda para Venezuela y no atienden esta emergencia. |

---

## 🗄️ Base de datos (producción)

En **Vercel** el sistema de archivos es efímero, así que el store JSON **no** sirve para producción: usa **Postgres**.

1. Crea una base Postgres (la integración **Neon** del Marketplace de Vercel inyecta `DATABASE_URL` automáticamente).
2. Define `DATABASE_URL` (o `POSTGRES_URL`) en las variables de entorno del proyecto (o en `.env.local` para correr los scripts).
3. Siembra los datos iniciales:

```bash
npm run seed                  # crea/migra la tabla y carga data/centers.seed.json (upsert por id)
npm run seed -- --list-extra  # lista los puntos de la base que NO están en la semilla
npm run seed -- --purge-extra # ⚠️ los elimina (irreversible)
```

> **Al cambiar de emergencia**, la base conserva los puntos de la anterior. Revísalos con `--list-extra` antes de purgar: `--purge-extra` también borraría los reportes ciudadanos aprobados que no estén en la semilla.

El selector de store vive en `lib/db/index.ts`: si detecta `DATABASE_URL`/`POSTGRES_URL` usa Postgres; si no, JSON local.

---

## 🌐 Scraper de fuentes públicas

```bash
npm run scrape   # ejecuta los adaptadores de scripts/sources/ y genera data/scraped/curados.json
```

- Las fuentes son **adaptadores intercambiables** en `scripts/sources/`. Para añadir una, copia `scripts/sources/_template.ts`.
- Cada centro scrapeado se guarda con su **URL de origen** y estado `sin_verificar`.
- La transparencia sobre qué se halló (y qué no) está en [`docs/fuentes.md`](docs/fuentes.md).
- Los datos curados se integran a `data/centers.seed.json` tras revisión humana.

---

## 🔌 API pública (open source)

API REST **abierta, gratuita y con CORS** para que cualquiera construya encima
(bots, apps, mapas). Documentación interactiva en **[`/api-docs`](https://red-acopio-two.vercel.app/api-docs)** y especificación **OpenAPI 3.1** en `/api/openapi.json`.

Base: `https://red-acopio-two.vercel.app/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/centers` | Lista de puntos. Filtros: `?kind=`, `?operational=`, `?city=`, `?material=`, `?status=`, `?source=all\|official\|local`, `?q=` |
| `GET` | `/api/v1/centers/{id}` | Un punto por id |
| `POST` | `/api/v1/centers` | Recomendar un punto (queda como `reportado`) |

```bash
# Albergues en Manizales
curl "https://red-acopio-two.vercel.app/api/v1/centers?city=Manizales&kind=albergue"

# Acopios que aún reciben (excluye saturados y cerrados)
curl "https://red-acopio-two.vercel.app/api/v1/centers?kind=acopio&operational=recibiendo"
```

```json
{
  "attribution": "Puntos de ayuda del sismo de Colombia del 10 de agosto de 2026…",
  "total": 3,
  "items": [ { "id": "...", "name": "...", "kind": "albergue", "operational": "recibiendo", "status": "sin_verificar", "source": "https://…", ... } ]
}
```

> **Si reutilizas los datos, conserva `source` y `status`.** En una emergencia, un dato sin procedencia ni nivel de verificación es un riesgo, no una comodidad.

---

## ☁️ Despliegue en Vercel

```bash
npm i -g vercel        # si no lo tienes
vercel login
vercel                 # despliegue de previsualización
vercel --prod          # despliegue a producción
```

Recuerda configurar `DATABASE_URL` y (opcional) `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en el panel del proyecto, y correr `npm run seed` una vez.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Lee **[CONTRIBUTING.md](CONTRIBUTING.md)** para la arquitectura, las fronteras entre módulos y los puntos de extensión sugeridos (filtros avanzados, notificaciones, integración con WhatsApp, analítica de centros más usados).

## 📄 Licencia

MIT. Úsalo, adáptalo y compártelo para cualquier causa humanitaria.
